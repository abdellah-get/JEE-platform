package ma.ensem.jee.platform.project.dto;

import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.project.ProjectStatus;

public record UpdateProjectRequest(
		@Size(max = 160) String name,
		@Size(max = 4000) String description,
		ProjectStatus status) {
}
