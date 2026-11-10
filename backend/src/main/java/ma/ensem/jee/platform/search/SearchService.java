package ma.ensem.jee.platform.search;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.announcement.AnnouncementRepository;
import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectAccessService;
import ma.ensem.jee.platform.project.ProjectRepository;
import ma.ensem.jee.platform.search.dto.SearchHitResponse;
import ma.ensem.jee.platform.search.dto.SearchResponse;
import ma.ensem.jee.platform.task.Task;
import ma.ensem.jee.platform.task.TaskRepository;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class SearchService {

	private static final int PER_TYPE = 6;

	private final ProjectRepository projectRepository;
	private final TaskRepository taskRepository;
	private final AnnouncementRepository announcementRepository;
	private final UserRepository userRepository;
	private final ProjectAccessService accessService;

	public SearchService(
			ProjectRepository projectRepository,
			TaskRepository taskRepository,
			AnnouncementRepository announcementRepository,
			UserRepository userRepository,
			ProjectAccessService accessService) {
		this.projectRepository = projectRepository;
		this.taskRepository = taskRepository;
		this.announcementRepository = announcementRepository;
		this.userRepository = userRepository;
		this.accessService = accessService;
	}

	@Transactional(readOnly = true)
	public SearchResponse search(String rawQuery) {
		UserPrincipal current = SecurityUtils.currentUser();
		String q = rawQuery == null ? "" : rawQuery.trim();
		if (q.length() < 2) {
			return new SearchResponse(q, List.of());
		}

		String needle = q.toLowerCase(Locale.ROOT);
		List<SearchHitResponse> hits = new ArrayList<>();

		List<Project> projects = accessService.isClubStaff(current)
				? projectRepository.findAllByOrderByUpdatedAtDesc(PageRequest.of(0, 80)).getContent()
				: projectRepository.findAllVisibleToMember(current.getId(), PageRequest.of(0, 80)).getContent();
		Set<UUID> visibleProjectIds = new HashSet<>();
		projects.stream()
				.filter(p -> contains(needle, p.getName(), p.getDescription()))
				.limit(PER_TYPE)
				.forEach(p -> {
					visibleProjectIds.add(p.getId());
					hits.add(new SearchHitResponse(
							"PROJECT",
							p.getId().toString(),
							p.getName(),
							p.getStatus().name(),
							"/projects/" + p.getId()));
				});
		projects.forEach(p -> visibleProjectIds.add(p.getId()));

		taskRepository.searchByText(q, PageRequest.of(0, 30)).getContent().stream()
				.filter(t -> accessService.isClubStaff(current) || visibleProjectIds.contains(t.getProjectId()))
				.limit(PER_TYPE)
				.forEach(t -> hits.add(taskHit(t)));

		announcementRepository.findAllByOrderByPinnedDescCreatedAtDesc(PageRequest.of(0, 40)).getContent()
				.stream()
				.filter(a -> contains(needle, a.getTitle(), a.getBody()))
				.limit(PER_TYPE)
				.forEach(a -> hits.add(new SearchHitResponse(
						"ANNOUNCEMENT",
						a.getId().toString(),
						a.getTitle(),
						a.isPinned() ? "Épinglée" : "Annonce",
						"/announcements/" + a.getId())));

		if (accessService.isClubStaff(current)) {
			userRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc().stream()
					.filter(u -> contains(needle, u.getFirstName(), u.getLastName(), u.getEmail()))
					.limit(PER_TYPE)
					.forEach(u -> hits.add(memberHit(u)));
		}

		return new SearchResponse(q, List.copyOf(hits));
	}

	private static SearchHitResponse taskHit(Task task) {
		return new SearchHitResponse(
				"TASK",
				task.getId().toString(),
				task.getTitle(),
				task.getStatus().name(),
				"/projects/" + task.getProjectId() + "/tasks");
	}

	private static SearchHitResponse memberHit(User user) {
		return new SearchHitResponse(
				"MEMBER",
				user.getId().toString(),
				user.getFirstName() + " " + user.getLastName(),
				user.getEmail(),
				"/admin/members");
	}

	private static boolean contains(String needle, String... fields) {
		for (String field : fields) {
			if (field != null && field.toLowerCase(Locale.ROOT).contains(needle)) {
				return true;
			}
		}
		return false;
	}
}
