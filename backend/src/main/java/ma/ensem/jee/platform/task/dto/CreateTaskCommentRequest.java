package ma.ensem.jee.platform.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTaskCommentRequest(
		@NotBlank @Size(max = 4000) String body) {
}
