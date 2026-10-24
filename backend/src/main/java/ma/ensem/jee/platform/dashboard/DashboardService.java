package ma.ensem.jee.platform.dashboard;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.announcement.AnnouncementRepository;
import ma.ensem.jee.platform.announcement.AnnouncementService;
import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.dashboard.dto.DashboardKpis;
import ma.ensem.jee.platform.dashboard.dto.DashboardResponse;
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
		if (current.getClubRole() == ClubRole.BUREAU || current.getClubRole() == ClubRole.ADMIN_TECH) {
			kpis = new DashboardKpis(
					userRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc().size(),
					projectRepository.count(),
					projectRepository.countByStatus(ProjectStatus.ACTIF),
					taskRepository.countByStatusNot(TaskStatus.DONE),
					announcementRepository.countByPinnedTrue());
		}

		return new DashboardResponse(
				current.getClubRole(),
				announcementService.listPinned(),
				projects,
				tasks,
				kpis);
	}
}
