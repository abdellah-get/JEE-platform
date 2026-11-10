package ma.ensem.jee.platform.auth.totp.dto;

import java.util.List;

public record TotpSetupResponse(
		String secret,
		String otpAuthUri,
		List<String> recoveryCodes) {
}
