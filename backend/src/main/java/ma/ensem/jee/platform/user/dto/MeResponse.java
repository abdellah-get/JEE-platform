package ma.ensem.jee.platform.user.dto;

import java.util.UUID;

import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;

public record MeResponse(
		UUID userId,
		String email,
		String firstName,
		String lastName,
		ClubRole clubRole,
		boolean active) {

	public static MeResponse from(User user) {
		return new MeResponse(
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getClubRole(),
				user.isActive());
	}
}
