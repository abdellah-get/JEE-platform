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

	/** Visible for integration tests. */
	public String getLastResetUrl() {
		return lastResetUrl.get();
	}
}
