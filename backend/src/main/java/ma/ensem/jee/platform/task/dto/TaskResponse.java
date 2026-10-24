package ma.ensem.jee.platform.task.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import ma.ensem.jee.platform.task.Task;
import ma.ensem.jee.platform.task.TaskPriority;
import ma.ensem.jee.platform.task.TaskStatus;

public record TaskResponse(
		UUID id,
		UUID projectId,
		String projectName,
		String title,
		String description,
		TaskStatus status,
		TaskPriority priority,
		UUID assigneeId,
		String assigneeName,
		LocalDate dueDate,
		int sortOrder,
		UUID createdBy,
		Instant createdAt,
		Instant updatedAt) {

	public static TaskResponse from(Task task, String projectName, String assigneeName) {
		return new TaskResponse(
				task.getId(),
				task.getProjectId(),
				projectName,
				task.getTitle(),
				task.getDescription(),
				task.getStatus(),
				task.getPriority(),
				task.getAssigneeId(),
				assigneeName,
				task.getDueDate(),
				task.getSortOrder(),
				task.getCreatedBy(),
				task.getCreatedAt(),
				task.getUpdatedAt());
	}
}
