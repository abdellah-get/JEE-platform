package ma.ensem.jee.platform.workload.dto;

import java.util.UUID;

public record MemberWorkloadResponse(
		UUID userId,
		String firstName,
		String lastName,
		String email,
		long openTasks,
		long overdueTasks,
		long highPriorityOpen,
		long projectCount) {
}
