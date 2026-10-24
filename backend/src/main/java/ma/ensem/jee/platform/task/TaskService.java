package ma.ensem.jee.platform.task;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectAccessService;
import ma.ensem.jee.platform.project.ProjectMemberRepository;
import ma.ensem.jee.platform.project.ProjectRepository;
import ma.ensem.jee.platform.task.dto.CreateTaskRequest;
import ma.ensem.jee.platform.task.dto.TaskResponse;
import ma.ensem.jee.platform.task.dto.UpdateTaskRequest;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class TaskService {

	private final TaskRepository taskRepository;
	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final ProjectAccessService accessService;
	private final UserRepository userRepository;

	public TaskService(
			TaskRepository taskRepository,
			ProjectRepository projectRepository,
			ProjectMemberRepository projectMemberRepository,
			ProjectAccessService accessService,
			UserRepository userRepository) {
		this.taskRepository = taskRepository;
		this.projectRepository = projectRepository;
		this.projectMemberRepository = projectMemberRepository;
		this.accessService = accessService;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> listByProject(UUID projectId) {
		UserPrincipal current = SecurityUtils.currentUser();
		Project project = accessService.requireVisibleProject(projectId, current);
		return toResponses(taskRepository.findByProjectIdOrderBySortOrderAscCreatedAtAsc(projectId), project.getName());
	}

	@Transactional
	public TaskResponse create(UUID projectId, CreateTaskRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		Project project = accessService.requireVisibleProject(projectId, current);

		UUID assigneeId = request.assigneeId();
		if (assigneeId != null) {
			requireAssigneeIsMember(projectId, assigneeId);
		}

		TaskStatus status = request.status() != null ? request.status() : TaskStatus.TODO;
		TaskPriority priority = request.priority() != null ? request.priority() : TaskPriority.MEDIUM;
		int sortOrder = (int) taskRepository.countByProjectId(projectId);

		Task task = new Task(
				projectId,
				request.title().trim(),
				normalize(request.description()),
				status,
				priority,
				assigneeId,
				request.dueDate(),
				sortOrder,
				current.getId());
		taskRepository.save(task);
		recalculateProgress(project);

		return toResponse(task, project.getName());
	}

	@Transactional(readOnly = true)
	public TaskResponse get(UUID taskId) {
		UserPrincipal current = SecurityUtils.currentUser();
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new ResourceNotFoundException("Tâche introuvable"));
		Project project = accessService.requireVisibleProject(task.getProjectId(), current);
		return toResponse(task, project.getName());
	}

	@Transactional
	public TaskResponse update(UUID taskId, UpdateTaskRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new ResourceNotFoundException("Tâche introuvable"));
		Project project = accessService.requireVisibleProject(task.getProjectId(), current);

		if (request.title() != null && !request.title().isBlank()) {
			task.setTitle(request.title().trim());
		}
		if (request.description() != null) {
			task.setDescription(normalize(request.description()));
		}
		if (request.status() != null) {
			task.setStatus(request.status());
		}
		if (request.priority() != null) {
			task.setPriority(request.priority());
		}
		if (Boolean.TRUE.equals(request.clearAssignee())) {
			task.setAssigneeId(null);
		}
		else if (request.assigneeId() != null) {
			requireAssigneeIsMember(task.getProjectId(), request.assigneeId());
			task.setAssigneeId(request.assigneeId());
		}
		if (Boolean.TRUE.equals(request.clearDueDate())) {
			task.setDueDate(null);
		}
		else if (request.dueDate() != null) {
			task.setDueDate(request.dueDate());
		}
		if (request.sortOrder() != null) {
			task.setSortOrder(request.sortOrder());
		}

		recalculateProgress(project);
		return toResponse(task, project.getName());
	}

	@Transactional
	public void delete(UUID taskId) {
		UserPrincipal current = SecurityUtils.currentUser();
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new ResourceNotFoundException("Tâche introuvable"));
		Project project = accessService.requireVisibleProject(task.getProjectId(), current);
		taskRepository.delete(task);
		recalculateProgress(project);
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> listMine(TaskStatus status, TaskPriority priority, UUID projectId) {
		UserPrincipal current = SecurityUtils.currentUser();
		List<Task> tasks = taskRepository.findAssignedTo(current.getId(), status, priority, projectId);

		Set<UUID> projectIds = tasks.stream().map(Task::getProjectId).collect(Collectors.toSet());
		Map<UUID, Project> projects = projectRepository.findAllById(projectIds).stream()
				.collect(Collectors.toMap(Project::getId, Function.identity()));

		// Filtre les projets encore visibles (défense en profondeur)
		return tasks.stream()
				.filter(t -> {
					Project p = projects.get(t.getProjectId());
					if (p == null) {
						return false;
					}
					try {
						accessService.requireVisibleProject(p.getId(), current);
						return true;
					}
					catch (RuntimeException ex) {
						return false;
					}
				})
				.map(t -> toResponse(t, projects.get(t.getProjectId()).getName()))
				.toList();
	}

	private void recalculateProgress(Project project) {
		long total = taskRepository.countByProjectId(project.getId());
		if (total == 0) {
			project.setProgressPercent(0);
			return;
		}
		long done = taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.DONE);
		project.setProgressPercent((int) Math.round((done * 100.0) / total));
	}

	private void requireAssigneeIsMember(UUID projectId, UUID assigneeId) {
		User user = userRepository.findById(assigneeId)
				.orElseThrow(() -> new ResourceNotFoundException("Assigné introuvable"));
		if (!user.isActive()) {
			throw new IllegalArgumentException("Impossible d'assigner un membre inactif");
		}
		if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId)) {
			throw new IllegalArgumentException("L'assigné doit être membre du projet");
		}
	}

	private List<TaskResponse> toResponses(List<Task> tasks, String projectName) {
		return tasks.stream().map(t -> toResponse(t, projectName)).toList();
	}

	private TaskResponse toResponse(Task task, String projectName) {
		String assigneeName = null;
		if (task.getAssigneeId() != null) {
			assigneeName = userRepository.findById(task.getAssigneeId())
					.map(u -> u.getFirstName() + " " + u.getLastName())
					.orElse(null);
		}
		return TaskResponse.from(task, projectName, assigneeName);
	}

	private static String normalize(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
