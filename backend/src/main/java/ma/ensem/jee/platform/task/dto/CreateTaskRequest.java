package ma.ensem.jee.platform.task.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.task.TaskPriority;
import ma.ensem.jee.platform.task.TaskStatus;

public record CreateTaskRequest(
		@NotBlank @Size(max = 200) String title,
		@Size(max = 4000) String description,
		TaskStatus status,
		TaskPriority priority,
		UUID assigneeId,
		LocalDate dueDate) {
}
