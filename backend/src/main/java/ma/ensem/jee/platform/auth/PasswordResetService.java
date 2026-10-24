package ma.ensem.jee.platform.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.dto.ForgotPasswordRequest;
import ma.ensem.jee.platform.auth.dto.ResetPasswordRequest;
import ma.ensem.jee.platform.mail.MailService;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class PasswordResetService {

	private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
	private static final SecureRandom RANDOM = new SecureRandom();

	private final UserRepository userRepository;
	private final PasswordResetTokenRepository tokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final MailService mailService;
	private final PasswordResetProperties properties;

	public PasswordResetService(
			UserRepository userRepository,
			PasswordResetTokenRepository tokenRepository,
			PasswordEncoder passwordEncoder,
			MailService mailService,
			PasswordResetProperties properties) {
		this.userRepository = userRepository;
		this.tokenRepository = tokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.mailService = mailService;
		this.properties = properties;
	}

	/**
	 * Always succeeds from the caller's perspective (anti-enumeration).
	 */
	@Transactional
	public void forgotPassword(ForgotPasswordRequest request) {
		String email = request.email().trim().toLowerCase();
		userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
			if (!user.isActive()) {
				log.info("Password reset skipped for inactive user {}", email);
				return;
			}
			Instant now = Instant.now();
			tokenRepository.invalidateOpenTokensForUser(user.getId(), now);

			String rawToken = generateRawToken();
			Instant expiresAt = now.plusSeconds(properties.getTtlMinutes() * 60);
			tokenRepository.save(new PasswordResetToken(user, sha256(rawToken), expiresAt));

			String base = properties.getFrontendBaseUrl().replaceAll("/$", "");
			String resetUrl = base + "/reset-password?token=" + rawToken;
			mailService.sendPasswordReset(user.getEmail(), resetUrl);
		});
	}

	@Transactional
	public void resetPassword(ResetPasswordRequest request) {
		String hash = sha256(request.token().trim());
		PasswordResetToken token = tokenRepository.findByTokenHashAndUsedAtIsNull(hash)
				.orElseThrow(() -> new BadCredentialsException("Lien de réinitialisation invalide ou expiré"));

		Instant now = Instant.now();
		if (token.isExpired(now)) {
			throw new BadCredentialsException("Lien de réinitialisation invalide ou expiré");
		}

		User user = token.getUser();
		if (!user.isActive()) {
			throw new BadCredentialsException("Compte désactivé");
		}

		user.setPasswordHash(passwordEncoder.encode(request.password()));
		token.markUsed();
		tokenRepository.invalidateOpenTokensForUser(user.getId(), now);
	}

	private static String generateRawToken() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	static String sha256(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hashed);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 not available", ex);
		}
	}
}
