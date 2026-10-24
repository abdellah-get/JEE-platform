package ma.ensem.jee.platform.task;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.project.ProjectAccessService;
import ma.ensem.jee.platform.project.ProjectRole;
import ma.ensem.jee.platform.task.dto.CreateTaskCommentRequest;
import ma.ensem.jee.platform.task.dto.TaskCommentResponse;
import ma.ensem.jee.platform.task.dto.UpdateTaskCommentRequest;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class TaskCommentService {

	private final TaskCommentRepository commentRepository;
	private final TaskRepository taskRepository;
	private final ProjectAccessService accessService;
	private final UserRepository userRepository;

	public TaskCommentService(
			TaskCommentRepository commentRepository,
			TaskRepository taskRepository,
			ProjectAccessService accessService,
			UserRepository userRepository) {
		this.commentRepository = commentRepository;
		this.taskRepository = taskRepository;
		this.accessService = accessService;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<TaskCommentResponse> listByTask(UUID taskId) {
		requireVisibleTask(taskId);
		return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public TaskCommentResponse create(UUID taskId, CreateTaskCommentRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		requireVisibleTask(taskId);

		String body = request.body().trim();
		TaskComment comment = new TaskComment(taskId, current.getId(), body);
		commentRepository.save(comment);
		return toResponse(comment);
	}

	@Transactional
	public TaskCommentResponse update(UUID commentId, UpdateTaskCommentRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		TaskComment comment = commentRepository.findById(commentId)
				.orElseThrow(() -> new ResourceNotFoundException("Commentaire introuvable"));
		requireVisibleTask(comment.getTaskId());

		if (!comment.getAuthorId().equals(current.getId())) {
			throw new AccessDeniedException("Seul l'auteur peut modifier ce commentaire");
		}

		comment.setBody(request.body().trim());
		return toResponse(comment);
	}

	@Transactional
	public void delete(UUID commentId) {
		UserPrincipal current = SecurityUtils.currentUser();
		TaskComment comment = commentRepository.findById(commentId)
				.orElseThrow(() -> new ResourceNotFoundException("Commentaire introuvable"));
		Task task = requireVisibleTask(comment.getTaskId());

		boolean author = comment.getAuthorId().equals(current.getId());
		boolean staff = accessService.isClubStaff(current);
		boolean chef = accessService.findRole(task.getProjectId(), current.getId())
				.map(role -> role == ProjectRole.CHEF_PROJET)
				.orElse(false);

		if (!author && !staff && !chef) {
			throw new AccessDeniedException("Suppression non autorisée");
		}

		commentRepository.delete(comment);
	}

	private Task requireVisibleTask(UUID taskId) {
		UserPrincipal current = SecurityUtils.currentUser();
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new ResourceNotFoundException("Tâche introuvable"));
		accessService.requireVisibleProject(task.getProjectId(), current);
		return task;
	}

	private TaskCommentResponse toResponse(TaskComment comment) {
		String authorName = userRepository.findById(comment.getAuthorId())
				.map(u -> u.getFirstName() + " " + u.getLastName())
				.orElse("Inconnu");
		return TaskCommentResponse.from(comment, authorName);
	}
}
