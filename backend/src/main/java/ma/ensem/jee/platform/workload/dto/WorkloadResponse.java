package ma.ensem.jee.platform.workload.dto;

import java.util.List;

public record WorkloadResponse(
		List<MemberWorkloadResponse> members,
		long totalOpenTasks,
		long totalOverdueTasks) {
}
