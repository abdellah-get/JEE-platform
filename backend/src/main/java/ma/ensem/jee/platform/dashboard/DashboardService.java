package ma.ensem.jee.platform.dashboard;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.announcement.AnnouncementRepository;
import ma.ensem.jee.platform.announcement.AnnouncementService;
import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.dashboard.dto.DashboardKpis;
import ma.ensem.jee.platform.dashboard.dto.DashboardResponse;
import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectRepository;
import ma.ensem.jee.platform.project.ProjectService;
import ma.ensem.jee.platform.project.ProjectStatus;
import ma.ensem.jee.platform.project.dto.ProjectResponse;
import ma.ensem.jee.platform.task.TaskRepository;
import ma.ensem.jee.platform.task.TaskService;
import ma.ensem.jee.platform.task.TaskStatus;
import ma.ensem.jee.platform.task.dto.TaskResponse;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class DashboardService {

	private final AnnouncementService announcementService;
	private final AnnouncementRepository announcementRepository;
	private final ProjectService projectService;
	private final ProjectRepository projectRepository;
	private final TaskService taskService;
	private final TaskRepository taskRepository;
	private final UserRepository userRepository;

	public DashboardService(
			AnnouncementService announcementService,
			AnnouncementRepository announcementRepository,
			ProjectService projectService,
			ProjectRepository projectRepository,
			TaskService taskService,
			TaskRepository taskRepository,
			UserRepository userRepository) {
		this.announcementService = announcementService;
		this.announcementRepository = announcementRepository;
		this.projectService = projectService;
		this.projectRepository = projectRepository;
		this.taskService = taskService;
		this.taskRepository = taskRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public DashboardResponse get() {
		UserPrincipal current = SecurityUtils.currentUser();

		List<ProjectResponse> projects = projectService.list().stream().limit(6).toList();
		List<TaskResponse> tasks = taskService.listMine(null, null, null).stream()
				.filter(t -> t.status() != TaskStatus.DONE)
				.limit(8)
				.toList();

		DashboardKpis kpis = null;
		if (isBureau(current)) {
			kpis = buildKpis();
		}

		return new DashboardResponse(
				current.getClubRole(),
				announcementService.listPinned(),
				projects,
				tasks,
				kpis);
	}

	@Transactional(readOnly = true)
	public String exportProjectsCsv() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (!isBureau(current)) {
			throw new AccessDeniedException("Export réservé au bureau");
		}

		LocalDate today = LocalDate.now();
		StringBuilder csv = new StringBuilder();
		csv.append("project_id,project_name,status,progress_percent,open_tasks,overdue_tasks\n");

		List<Project> projects = projectRepository.findAllByOrderByUpdatedAtDesc();
		for (Project project : projects) {
			long open = taskRepository.countOpenByProjectId(project.getId());
			long overdue = taskRepository.countOverdueByProjectId(project.getId(), today);
			csv.append(project.getId())
					.append(',')
					.append(csvEscape(project.getName()))
					.append(',')
					.append(project.getStatus().name())
					.append(',')
					.append(project.getProgressPercent())
					.append(',')
					.append(open)
					.append(',')
					.append(overdue)
					.append('\n');
		}
		return csv.toString();
	}

	private DashboardKpis buildKpis() {
		LocalDate today = LocalDate.now();
		double avg = projectRepository.averageProgressPercent();
		double rounded = Math.round(avg * 10.0) / 10.0;
		return new DashboardKpis(
				userRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc().size(),
				projectRepository.count(),
				projectRepository.countByStatus(ProjectStatus.ACTIF),
				taskRepository.countByStatusNot(TaskStatus.DONE),
				announcementRepository.countByPinnedTrue(),
				projectRepository.countByStatus(ProjectStatus.BROUILLON),
				projectRepository.countByStatus(ProjectStatus.ACTIF),
				projectRepository.countByStatus(ProjectStatus.TERMINE),
				projectRepository.countByStatus(ProjectStatus.ARCHIVE),
				rounded,
				taskRepository.countOverdue(today));
	}

	private static boolean isBureau(UserPrincipal user) {
		return user.getClubRole() == ClubRole.BUREAU || user.getClubRole() == ClubRole.ADMIN_TECH;
	}

	private static String csvEscape(String value) {
		if (value == null) {
			return "";
		}
		String escaped = value.replace("\"", "\"\"");
		if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
			return "\"" + escaped + "\"";
		}
		return escaped;
	}
}
