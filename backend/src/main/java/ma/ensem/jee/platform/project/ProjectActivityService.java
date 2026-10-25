package ma.ensem.jee.platform.project;

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
import ma.ensem.jee.platform.project.dto.ProjectActivityResponse;
import ma.ensem.jee.platform.task.TaskStatus;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class ProjectActivityService {

	private final ProjectActivityRepository activityRepository;
	private final ProjectAccessService accessService;
	private final UserRepository userRepository;

	public ProjectActivityService(
			ProjectActivityRepository activityRepository,
			ProjectAccessService accessService,
			UserRepository userRepository) {
		this.activityRepository = activityRepository;
		this.accessService = accessService;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<ProjectActivityResponse> list(UUID projectId) {
		UserPrincipal current = SecurityUtils.currentUser();
		accessService.requireVisibleProject(projectId, current);

		List<ProjectActivity> activities = activityRepository.findTop50ByProjectIdOrderByCreatedAtDesc(projectId);
		Set<UUID> actorIds = activities.stream().map(ProjectActivity::getActorUserId).collect(Collectors.toSet());
		Map<UUID, User> actors = userRepository.findAllById(actorIds).stream()
				.collect(Collectors.toMap(User::getId, Function.identity()));

		return activities.stream()
				.map(a -> ProjectActivityResponse.from(a, displayName(actors.get(a.getActorUserId()))))
				.toList();
	}

	@Transactional
	public void recordTaskCreated(UUID projectId, UUID actorId, UUID taskId, String taskTitle) {
		String actor = actorLabel(actorId);
		save(projectId, actorId, ProjectActivityType.TASK_CREATED,
				actor + " a créé la tâche « " + truncate(taskTitle) + " »", taskId);
	}

	@Transactional
	public void recordTaskStatusChanged(
			UUID projectId, UUID actorId, UUID taskId, String taskTitle, TaskStatus from, TaskStatus to) {
		if (from == to) {
			return;
		}
		String actor = actorLabel(actorId);
		save(projectId, actorId, ProjectActivityType.TASK_STATUS_CHANGED,
				actor + " a déplacé « " + truncate(taskTitle) + " » : "
						+ statusLabel(from) + " → " + statusLabel(to),
				taskId);
	}

	@Transactional
	public void recordTaskDeleted(UUID projectId, UUID actorId, String taskTitle) {
		String actor = actorLabel(actorId);
		save(projectId, actorId, ProjectActivityType.TASK_DELETED,
				actor + " a supprimé la tâche « " + truncate(taskTitle) + " »", null);
	}

	@Transactional
	public void recordMemberAdded(UUID projectId, UUID actorId, String memberName, ProjectRole role) {
		String actor = actorLabel(actorId);
		save(projectId, actorId, ProjectActivityType.MEMBER_ADDED,
				actor + " a ajouté " + memberName + " (" + roleLabel(role) + ")", null);
	}

	@Transactional
	public void recordMemberRemoved(UUID projectId, UUID actorId, String memberName) {
		String actor = actorLabel(actorId);
		save(projectId, actorId, ProjectActivityType.MEMBER_REMOVED,
				actor + " a retiré " + memberName, null);
	}

	private void save(
			UUID projectId, UUID actorId, ProjectActivityType type, String message, UUID taskId) {
		activityRepository.save(new ProjectActivity(projectId, actorId, type, truncateMessage(message), taskId));
	}

	private String actorLabel(UUID actorId) {
		return userRepository.findById(actorId)
				.map(this::displayName)
				.orElse("Quelqu’un");
	}

	private String displayName(User user) {
		if (user == null) {
			return "Membre";
		}
		return user.getFirstName() + " " + user.getLastName();
	}

	private static String statusLabel(TaskStatus status) {
		return switch (status) {
			case TODO -> "À faire";
			case IN_PROGRESS -> "En cours";
			case DONE -> "Fait";
		};
	}

	private static String roleLabel(ProjectRole role) {
		return role == ProjectRole.CHEF_PROJET ? "chef" : "contributeur";
	}

	private static String truncate(String value) {
		if (value == null) {
			return "";
		}
		String trimmed = value.trim();
		return trimmed.length() <= 80 ? trimmed : trimmed.substring(0, 77) + "…";
	}

	private static String truncateMessage(String value) {
		if (value.length() <= 500) {
			return value;
		}
		return value.substring(0, 497) + "…";
	}
}
