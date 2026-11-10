package ma.ensem.jee.platform.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ma.ensem.jee.platform.project.ProjectRole;

public record InviteMemberRequest(
		@NotBlank @Email String email,
		@NotNull ProjectRole role) {
}
