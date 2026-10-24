package ma.ensem.jee.platform.user.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;

public record AdminUserResponse(
		UUID userId,
		String email,
		String firstName,
		String lastName,
		ClubRole clubRole,
		boolean active,
		Instant createdAt) {

	public static AdminUserResponse from(User user) {
		return new AdminUserResponse(
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getClubRole(),
				user.isActive(),
				user.getCreatedAt());
	}
}
