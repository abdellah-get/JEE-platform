package ma.ensem.jee.platform.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "spring.mail.host")
public class SmtpMailService implements MailService {

	private static final Logger log = LoggerFactory.getLogger(SmtpMailService.class);

	private final JavaMailSender mailSender;
	private final String from;

	public SmtpMailService(
			JavaMailSender mailSender,
			@Value("${app.mail.from:noreply@ensem.jee}") String from) {
		this.mailSender = mailSender;
		this.from = from;
	}

	@Override
	public void sendPasswordReset(String toEmail, String resetUrl) {
		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(from);
		message.setTo(toEmail);
		message.setSubject("JEE Platform — Réinitialisation du mot de passe");
		message.setText("""
				Bonjour,

				Tu as demandé la réinitialisation de ton mot de passe JEE Platform.
				Ouvre ce lien (valide une heure) :

				%s

				Si tu n'es pas à l'origine de cette demande, ignore cet email.
				""".formatted(resetUrl));
		mailSender.send(message);
		log.info("Password reset email sent to {}", toEmail);
	}
}
