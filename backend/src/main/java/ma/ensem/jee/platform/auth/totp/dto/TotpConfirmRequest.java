package ma.ensem.jee.platform.auth.totp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TotpConfirmRequest(
		@NotBlank @Size(min = 6, max = 8) String code) {
}
