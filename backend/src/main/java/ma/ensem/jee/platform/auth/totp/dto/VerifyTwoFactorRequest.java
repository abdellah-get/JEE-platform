package ma.ensem.jee.platform.auth.totp.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyTwoFactorRequest(
		@NotBlank String preAuthToken,
		@NotBlank String code) {
}
