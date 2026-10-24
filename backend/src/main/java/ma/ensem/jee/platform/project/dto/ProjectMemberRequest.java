package ma.ensem.jee.platform.project.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import ma.ensem.jee.platform.project.ProjectRole;

public record ProjectMemberRequest(
		@NotNull UUID userId,
		@NotNull ProjectRole role) {
}
