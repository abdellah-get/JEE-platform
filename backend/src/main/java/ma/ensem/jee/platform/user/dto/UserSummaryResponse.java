package ma.ensem.jee.platform.user.dto;

import java.util.UUID;

import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;

public record UserSummaryResponse(
		UUID userId,
		String email,
		String firstName,
		String lastName,
		ClubRole clubRole) {

	public static UserSummaryResponse from(User user) {
		return new UserSummaryResponse(
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getClubRole());
	}
}
