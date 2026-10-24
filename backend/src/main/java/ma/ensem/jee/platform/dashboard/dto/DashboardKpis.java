package ma.ensem.jee.platform.dashboard.dto;

public record DashboardKpis(
		long activeMembers,
		long totalProjects,
		long activeProjects,
		long openTasks,
		long pinnedAnnouncements) {
}
