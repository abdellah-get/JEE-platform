package ma.ensem.jee.platform.task.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import ma.ensem.jee.platform.task.TaskStatus;

public record ReorderTasksRequest(
		@NotNull TaskStatus status,
		@NotEmpty List<@NotNull UUID> taskIds) {
}
