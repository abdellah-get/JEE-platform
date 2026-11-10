package ma.ensem.jee.platform.project.dto;

import java.util.UUID;

import ma.ensem.jee.platform.project.ProjectRole;

public record InviteMemberResponse(
		String email,
		boolean accountExists,
		boolean addedToProject,
		boolean emailSent,
		UUID userId,
		ProjectRole role,
		String message) {
}
