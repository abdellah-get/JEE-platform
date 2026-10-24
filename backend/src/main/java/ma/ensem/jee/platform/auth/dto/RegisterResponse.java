package ma.ensem.jee.platform.auth.dto;

import java.util.UUID;

import ma.ensem.jee.platform.user.ClubRole;

/**
 * Immediate auth when {@code pendingApproval=false}; otherwise message only (no tokens).
 */
public record RegisterResponse(
		boolean pendingApproval,
		String message,
		String accessToken,
		String tokenType,
		long expiresInMinutes,
		UUID userId,
		String email,
		String firstName,
		String lastName,
		ClubRole clubRole) {

	public static RegisterResponse pending(String message) {
		return new RegisterResponse(true, message, null, null, 0, null, null, null, null, null);
	}

	public static RegisterResponse authenticated(AuthResponse auth) {
		return new RegisterResponse(
				false,
				"Compte créé.",
				auth.accessToken(),
				auth.tokenType(),
				auth.expiresInMinutes(),
				auth.userId(),
				auth.email(),
				auth.firstName(),
				auth.lastName(),
				auth.clubRole());
	}

	public AuthResponse toAuthResponse() {
		return new AuthResponse(
				accessToken,
				tokenType,
				expiresInMinutes,
				userId,
				email,
				firstName,
				lastName,
				clubRole);
	}
}
