package ma.ensem.jee.platform.project.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.project.ProjectStatus;

public record CreateProjectRequest(
		@NotBlank @Size(max = 160) String name,
		@Size(max = 4000) String description,
		ProjectStatus status,
		UUID chefUserId) {
}
