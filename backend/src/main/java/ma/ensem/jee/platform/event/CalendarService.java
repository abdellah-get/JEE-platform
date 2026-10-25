package ma.ensem.jee.platform.event;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.BadRequestException;
import ma.ensem.jee.platform.event.dto.CalendarItemResponse;
import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectAccessService;
import ma.ensem.jee.platform.project.ProjectRepository;
import ma.ensem.jee.platform.task.Task;
import ma.ensem.jee.platform.task.TaskRepository;
import ma.ensem.jee.platform.task.TaskStatus;

@Service
public class CalendarService {

	private final ClubEventRepository eventRepository;
	private final TaskRepository taskRepository;
	private final ProjectRepository projectRepository;
	private final ProjectAccessService accessService;

	public CalendarService(
			ClubEventRepository eventRepository,
			TaskRepository taskRepository,
			ProjectRepository projectRepository,
			ProjectAccessService accessService) {
		this.eventRepository = eventRepository;
		this.taskRepository = taskRepository;
		this.projectRepository = projectRepository;
		this.accessService = accessService;
	}

	@Transactional(readOnly = true)
	public List<CalendarItemResponse> range(LocalDate from, LocalDate to) {
		UserPrincipal user = SecurityUtils.currentUser();
		if (from == null || to == null || to.isBefore(from)) {
			throw new BadRequestException("Plage de dates invalide");
		}
		if (from.plusMonths(3).isBefore(to)) {
			throw new BadRequestException("Plage maximale : 3 mois");
		}

		Instant fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
		Instant toInstant = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

		List<CalendarItemResponse> items = new ArrayList<>();

		for (ClubEvent event : eventRepository.findOverlapping(fromInstant, toInstant)) {
			items.add(new CalendarItemResponse(
					"EVENT",
					event.getId(),
					event.getTitle(),
					event.getStartsAt(),
					event.getEndsAt(),
					event.getLocation(),
					"/events/" + event.getId(),
					event.isPinned(),
					null));
		}

		Set<UUID> visibleProjectIds = visibleProjectIds(user);
		if (!visibleProjectIds.isEmpty()) {
			List<Task> tasks = taskRepository.findDueBetween(from, to);
			Map<UUID, String> projectNames = projectRepository.findAllById(visibleProjectIds).stream()
					.collect(Collectors.toMap(Project::getId, Project::getName));

			for (Task task : tasks) {
				if (!visibleProjectIds.contains(task.getProjectId())) {
					continue;
				}
				if (task.getStatus() == TaskStatus.DONE || task.getDueDate() == null) {
					continue;
				}
				Instant due = task.getDueDate().atStartOfDay().toInstant(ZoneOffset.UTC);
				items.add(new CalendarItemResponse(
						"TASK_DUE",
						task.getId(),
						task.getTitle(),
						due,
						null,
						null,
						"/projects/" + task.getProjectId() + "/tasks",
						false,
						projectNames.getOrDefault(task.getProjectId(), "Projet")));
			}
		}

		items.sort(Comparator.comparing(CalendarItemResponse::startsAt));
		return items;
	}

	private Set<UUID> visibleProjectIds(UserPrincipal user) {
		List<Project> projects = accessService.isClubStaff(user)
				? projectRepository.findAllByOrderByUpdatedAtDesc()
				: projectRepository.findAllVisibleToMember(user.getId());
		return projects.stream().map(Project::getId).collect(Collectors.toCollection(HashSet::new));
	}
}
