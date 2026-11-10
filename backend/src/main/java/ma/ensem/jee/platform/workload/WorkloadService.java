package ma.ensem.jee.platform.workload;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.task.Task;
import ma.ensem.jee.platform.task.TaskPriority;
import ma.ensem.jee.platform.task.TaskRepository;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;
import ma.ensem.jee.platform.workload.dto.MemberWorkloadResponse;
import ma.ensem.jee.platform.workload.dto.WorkloadResponse;

@Service
public class WorkloadService {

	private final TaskRepository taskRepository;
	private final UserRepository userRepository;

	public WorkloadService(TaskRepository taskRepository, UserRepository userRepository) {
		this.taskRepository = taskRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public WorkloadResponse get(UUID projectId, TaskPriority priority) {
		requireBureau();
		List<MemberWorkloadResponse> members = aggregate(projectId, priority);
		long totalOpen = members.stream().mapToLong(MemberWorkloadResponse::openTasks).sum();
		long totalOverdue = members.stream().mapToLong(MemberWorkloadResponse::overdueTasks).sum();
		return new WorkloadResponse(members, totalOpen, totalOverdue);
	}

	@Transactional(readOnly = true)
	public String exportCsv(UUID projectId, TaskPriority priority) {
		requireBureau();
		List<MemberWorkloadResponse> members = aggregate(projectId, priority);
		StringBuilder csv = new StringBuilder();
		csv.append("user_id,first_name,last_name,email,open_tasks,overdue_tasks,high_priority_open,project_count\n");
		for (MemberWorkloadResponse m : members) {
			csv.append(m.userId() == null ? "" : m.userId())
					.append(',')
					.append(csvEscape(m.firstName()))
					.append(',')
					.append(csvEscape(m.lastName()))
					.append(',')
					.append(csvEscape(m.email()))
					.append(',')
					.append(m.openTasks())
					.append(',')
					.append(m.overdueTasks())
					.append(',')
					.append(m.highPriorityOpen())
					.append(',')
					.append(m.projectCount())
					.append('\n');
		}
		return csv.toString();
	}

	private List<MemberWorkloadResponse> aggregate(UUID projectId, TaskPriority priority) {
		LocalDate today = LocalDate.now();
		List<Task> tasks = taskRepository.findOpenAssigned(projectId, priority);

		Map<UUID, Acc> byUser = new HashMap<>();
		for (Task task : tasks) {
			UUID assigneeId = task.getAssigneeId();
			Acc acc = byUser.computeIfAbsent(assigneeId, id -> new Acc());
			acc.open++;
			acc.projectIds.add(task.getProjectId());
			if (task.getDueDate() != null && task.getDueDate().isBefore(today)) {
				acc.overdue++;
			}
			if (task.getPriority() == TaskPriority.HIGH) {
				acc.high++;
			}
		}

		Map<UUID, User> users = userRepository.findAllById(byUser.keySet()).stream()
				.collect(Collectors.toMap(User::getId, u -> u));

		List<MemberWorkloadResponse> rows = new ArrayList<>();
		for (Map.Entry<UUID, Acc> entry : byUser.entrySet()) {
			User user = users.get(entry.getKey());
			Acc acc = entry.getValue();
			rows.add(new MemberWorkloadResponse(
					entry.getKey(),
					user != null ? user.getFirstName() : "?",
					user != null ? user.getLastName() : "?",
					user != null ? user.getEmail() : "",
					acc.open,
					acc.overdue,
					acc.high,
					acc.projectIds.size()));
		}

		rows.sort(Comparator
				.comparingLong(MemberWorkloadResponse::overdueTasks).reversed()
				.thenComparingLong(MemberWorkloadResponse::openTasks).reversed()
				.thenComparing(MemberWorkloadResponse::lastName, Comparator.nullsLast(String::compareToIgnoreCase)));
		return rows;
	}

	private void requireBureau() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.BUREAU && current.getClubRole() != ClubRole.ADMIN_TECH) {
			throw new AccessDeniedException("Réservé au bureau");
		}
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

	private static final class Acc {
		long open;
		long overdue;
		long high;
		final Set<UUID> projectIds = new HashSet<>();
	}
}
