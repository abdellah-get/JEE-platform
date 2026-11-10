package ma.ensem.jee.platform.mail;

public interface MailService {

	void sendPasswordReset(String toEmail, String resetUrl);

	void sendNotificationDigest(String toEmail, String subject, String body);

	void sendProjectInvite(
			String toEmail,
			String projectName,
			String inviterName,
			String projectUrl,
			boolean accountExists);
}
