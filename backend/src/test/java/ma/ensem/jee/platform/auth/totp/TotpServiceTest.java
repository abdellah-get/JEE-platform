package ma.ensem.jee.platform.auth.totp;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TotpServiceTest {

	private final TotpService totpService = new TotpService();

	@Test
	void verifiesCurrentCode() {
		String secret = totpService.generateSecret();
		String code = totpService.currentCode(secret);
		assertTrue(totpService.verify(secret, code));
		assertFalse(totpService.verify(secret, "000000"));
	}

	@Test
	void rejectsNullAndShort() {
		assertFalse(totpService.verify(null, "123456"));
		assertFalse(totpService.verify("ABCD", null));
		assertFalse(totpService.verify("ABCD", "12345"));
		assertFalse(totpService.verify("ABCD", "abcdef"));
	}
}
