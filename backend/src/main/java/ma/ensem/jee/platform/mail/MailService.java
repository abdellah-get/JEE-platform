package ma.ensem.jee.platform.mail;

public interface MailService {

	void sendPasswordReset(String toEmail, String resetUrl);

	void sendNotificationDigest(String toEmail, String subject, String body);
}
