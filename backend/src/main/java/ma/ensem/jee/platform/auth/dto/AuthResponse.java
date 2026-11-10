package ma.ensem.jee.platform.auth.dto;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

import ma.ensem.jee.platform.user.ClubRole;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
		String accessToken,
		String tokenType,
		Long expiresInMinutes,
		UUID userId,
		String email,
		String firstName,
		String lastName,
		ClubRole clubRole,
		Boolean requiresTwoFactor,
		String preAuthToken) {

	public static AuthResponse session(
			String accessToken,
			long expiresInMinutes,
			UUID userId,
			String email,
			String firstName,
			String lastName,
			ClubRole clubRole) {
		return new AuthResponse(
				accessToken,
				"Bearer",
				expiresInMinutes,
				userId,
				email,
				firstName,
				lastName,
				clubRole,
				false,
				null);
	}

	public static AuthResponse twoFactorChallenge(UUID userId, String email, String preAuthToken) {
		return new AuthResponse(
				null,
				null,
				null,
				userId,
				email,
				null,
				null,
				null,
				true,
				preAuthToken);
	}
}
