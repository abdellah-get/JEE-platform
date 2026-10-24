package ma.ensem.jee.platform.dashboard.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import ma.ensem.jee.platform.announcement.dto.AnnouncementResponse;
import ma.ensem.jee.platform.project.dto.ProjectResponse;
import ma.ensem.jee.platform.task.dto.TaskResponse;
import ma.ensem.jee.platform.user.ClubRole;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DashboardResponse(
		ClubRole clubRole,
		List<AnnouncementResponse> pinnedAnnouncements,
		List<ProjectResponse> myProjects,
		List<TaskResponse> myTasks,
		DashboardKpis kpis) {
}
