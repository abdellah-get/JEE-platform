package ma.ensem.jee.platform.project.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.project.ProjectMember;
import ma.ensem.jee.platform.project.ProjectRole;
import ma.ensem.jee.platform.user.User;

public record ProjectMemberResponse(
		UUID userId,
		String email,
		String firstName,
		String lastName,
		ProjectRole role,
		Instant joinedAt) {

	public static ProjectMemberResponse from(ProjectMember member, User user) {
		return new ProjectMemberResponse(
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				member.getProjectRole(),
				member.getJoinedAt());
	}
}
