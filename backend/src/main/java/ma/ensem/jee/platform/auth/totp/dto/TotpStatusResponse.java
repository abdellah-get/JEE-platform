package ma.ensem.jee.platform.auth.totp.dto;

public record TotpStatusResponse(
		boolean enabled,
		boolean pendingSetup,
		long unusedRecoveryCodes) {
}
