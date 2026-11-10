package ma.ensem.jee.platform.mail;

import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Default mail transport for local/dev/test — logs the reset link.
 * Disabled when {@code spring.mail.host} is set ({@link SmtpMailService}).
 */
@Service
@ConditionalOnProperty(prefix = "spring.mail", name = "host", matchIfMissing = true, havingValue = "false")
public class LoggingMailService implements MailService {

	private static final Logger log = LoggerFactory.getLogger(LoggingMailService.class);

	private final AtomicReference<String> lastResetUrl = new AtomicReference<>();

	@Override
	public void sendPasswordReset(String toEmail, String resetUrl) {
		lastResetUrl.set(resetUrl);
		log.info("[mail:log] Password reset for {} → {}", toEmail, resetUrl);
	}

	@Override
	public void sendNotificationDigest(String toEmail, String subject, String body) {
		log.info("[mail:log] Digest for {} — {}\n{}", toEmail, subject, body);
	}

	@Override
	public void sendProjectInvite(
			String toEmail,
			String projectName,
			String inviterName,
			String projectUrl,
			boolean accountExists) {
		log.info(
				"[mail:log] Project invite for {} → {} by {} (exists={}) {}",
				toEmail,
				projectName,
				inviterName,
				accountExists,
				projectUrl);
	}

	/** Visible for integration tests. */
	public String getLastResetUrl() {
		return lastResetUrl.get();
	}
}
