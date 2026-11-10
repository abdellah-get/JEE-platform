package ma.ensem.jee.platform.notification;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.mail.MailService;
import ma.ensem.jee.platform.user.DigestFrequency;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class DigestService {

	private static final Logger log = LoggerFactory.getLogger(DigestService.class);

	private final UserRepository userRepository;
	private final NotificationRepository notificationRepository;
	private final MailService mailService;
	private final String appBaseUrl;

	public DigestService(
			UserRepository userRepository,
			NotificationRepository notificationRepository,
			MailService mailService,
			@Value("${app.password-reset.frontend-base-url:http://localhost:3000}") String appBaseUrl) {
		this.userRepository = userRepository;
		this.notificationRepository = notificationRepository;
		this.mailService = mailService;
		this.appBaseUrl = appBaseUrl.endsWith("/")
				? appBaseUrl.substring(0, appBaseUrl.length() - 1)
				: appBaseUrl;
	}

	/** Daily 07:00 UTC — weekly recipients only on Monday. */
	@Scheduled(cron = "${app.digest.cron:0 0 7 * * *}")
	@Transactional
	public void sendScheduledDigests() {
		runDigest(false);
	}

	/** Manual / test entry point. */
	@Transactional
	public int runDigest(boolean force) {
		List<User> users = userRepository.findByActiveTrueAndEmailDigestEnabledTrue();
		LocalDate today = LocalDate.now(ZoneOffset.UTC);
		int sent = 0;
		for (User user : users) {
			if (!force && !shouldSendToday(user, today)) {
				continue;
			}
			if (sendDigestForUser(user)) {
				sent++;
			}
		}
		log.info("Notification digests sent: {} / {}", sent, users.size());
		return sent;
	}

	private boolean shouldSendToday(User user, LocalDate today) {
		if (user.getDigestFrequency() == DigestFrequency.WEEKLY && today.getDayOfWeek() != DayOfWeek.MONDAY) {
			return false;
		}
		Instant last = user.getLastDigestSentAt();
		if (last == null) {
			return true;
		}
		long days = ChronoUnit.DAYS.between(last, Instant.now());
		if (user.getDigestFrequency() == DigestFrequency.DAILY) {
			return days >= 1;
		}
		return days >= 6;
	}

	private boolean sendDigestForUser(User user) {
		Instant since = user.getLastDigestSentAt() != null
				? user.getLastDigestSentAt()
				: Instant.now().minus(7, ChronoUnit.DAYS);
		List<Notification> items = notificationRepository
				.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(user.getId(), since);
		if (items.isEmpty()) {
			user.setLastDigestSentAt(Instant.now());
			userRepository.save(user);
			return false;
		}

		String freq = user.getDigestFrequency() == DigestFrequency.DAILY ? "quotidien" : "hebdomadaire";
		String subject = "JEE Platform — Digest " + freq + " (" + items.size() + ")";
		StringBuilder body = new StringBuilder();
		body.append("Bonjour ").append(user.getFirstName()).append(",\n\n");
		body.append("Voici ton digest des notifications récentes :\n\n");
		for (Notification n : items.stream().limit(30).toList()) {
			body.append("• ").append(n.getTitle());
			if (n.getBody() != null && !n.getBody().isBlank()) {
				body.append(" — ").append(n.getBody());
			}
			if (n.getLink() != null && !n.getLink().isBlank()) {
				body.append("\n  ").append(appBaseUrl).append(n.getLink());
			}
			body.append("\n\n");
		}
		body.append("Gère tes préférences : ").append(appBaseUrl).append("/profile\n");

		mailService.sendNotificationDigest(user.getEmail(), subject, body.toString());
		user.setLastDigestSentAt(Instant.now());
		userRepository.save(user);
		return true;
	}
}
