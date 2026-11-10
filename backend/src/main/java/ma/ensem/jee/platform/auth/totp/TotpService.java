package ma.ensem.jee.platform.auth.totp;

import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

/**
 * RFC 6238 TOTP (HMAC-SHA1, 30s window, 6 digits) — no external dependency.
 */
@Service
public class TotpService {

	private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	private static final int PERIOD_SECONDS = 30;
	private static final int DIGITS = 6;
	private static final int WINDOW = 1;

	private final SecureRandom random = new SecureRandom();

	public String generateSecret() {
		byte[] bytes = new byte[20];
		random.nextBytes(bytes);
		return base32Encode(bytes);
	}

	public String otpAuthUri(String email, String secret, String issuer) {
		return "otpauth://totp/"
				+ urlEncode(issuer) + ":" + urlEncode(email)
				+ "?secret=" + secret
				+ "&issuer=" + urlEncode(issuer)
				+ "&algorithm=SHA1&digits=" + DIGITS + "&period=" + PERIOD_SECONDS;
	}

	public boolean verify(String secret, String code) {
		if (secret == null || code == null || !code.matches("\\d{6}")) {
			return false;
		}
		long counter = Instant.now().getEpochSecond() / PERIOD_SECONDS;
		byte[] key = base32Decode(secret);
		for (int i = -WINDOW; i <= WINDOW; i++) {
			String expected = hotp(key, counter + i);
			if (constantTimeEquals(expected, code)) {
				return true;
			}
		}
		return false;
	}

	/** Visible for unit tests. */
	String currentCode(String secret) {
		long counter = Instant.now().getEpochSecond() / PERIOD_SECONDS;
		return hotp(base32Decode(secret), counter);
	}

	public String[] generateRecoveryCodes(int count) {
		String[] codes = new String[count];
		for (int i = 0; i < count; i++) {
			int n = random.nextInt(100_000_000);
			codes[i] = String.format("%08d", n);
		}
		return codes;
	}

	private static String hotp(byte[] key, long counter) {
		try {
			byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
			Mac mac = Mac.getInstance("HmacSHA1");
			mac.init(new SecretKeySpec(key, "HmacSHA1"));
			byte[] hash = mac.doFinal(data);
			int offset = hash[hash.length - 1] & 0x0F;
			int binary = ((hash[offset] & 0x7F) << 24)
					| ((hash[offset + 1] & 0xFF) << 16)
					| ((hash[offset + 2] & 0xFF) << 8)
					| (hash[offset + 3] & 0xFF);
			int otp = binary % (int) Math.pow(10, DIGITS);
			return String.format("%0" + DIGITS + "d", otp);
		}
		catch (Exception ex) {
			throw new IllegalStateException("TOTP failure", ex);
		}
	}

	private static String base32Encode(byte[] data) {
		StringBuilder sb = new StringBuilder((data.length * 8 + 4) / 5);
		int buffer = 0;
		int bitsLeft = 0;
		for (byte b : data) {
			buffer = (buffer << 8) | (b & 0xFF);
			bitsLeft += 8;
			while (bitsLeft >= 5) {
				sb.append(ALPHABET.charAt((buffer >> (bitsLeft - 5)) & 31));
				bitsLeft -= 5;
			}
		}
		if (bitsLeft > 0) {
			sb.append(ALPHABET.charAt((buffer << (5 - bitsLeft)) & 31));
		}
		return sb.toString();
	}

	private static byte[] base32Decode(String encoded) {
		String s = encoded.trim().replace("=", "").toUpperCase();
		ByteBuffer out = ByteBuffer.allocate((s.length() * 5) / 8);
		int buffer = 0;
		int bitsLeft = 0;
		for (int i = 0; i < s.length(); i++) {
			int val = ALPHABET.indexOf(s.charAt(i));
			if (val < 0) {
				continue;
			}
			buffer = (buffer << 5) | val;
			bitsLeft += 5;
			if (bitsLeft >= 8) {
				out.put((byte) ((buffer >> (bitsLeft - 8)) & 0xFF));
				bitsLeft -= 8;
			}
		}
		byte[] result = new byte[out.position()];
		out.rewind();
		out.get(result);
		return result;
	}

	private static boolean constantTimeEquals(String a, String b) {
		if (a.length() != b.length()) {
			return false;
		}
		int r = 0;
		for (int i = 0; i < a.length(); i++) {
			r |= a.charAt(i) ^ b.charAt(i);
		}
		return r == 0;
	}

	private static String urlEncode(String value) {
		return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
	}
}
