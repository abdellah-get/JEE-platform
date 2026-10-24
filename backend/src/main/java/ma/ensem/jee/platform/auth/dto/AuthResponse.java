package ma.ensem.jee.platform.auth.dto;

import java.util.UUID;

import ma.ensem.jee.platform.user.ClubRole;

public record AuthResponse(
		String accessToken,
		String tokenType,
		long expiresInMinutes,
		UUID userId,
		String email,
		String firstName,
		String lastName,
		ClubRole clubRole) {
}
