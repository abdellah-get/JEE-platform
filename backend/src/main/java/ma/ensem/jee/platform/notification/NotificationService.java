package ma.ensem.jee.platform.notification;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.notification.dto.NotificationResponse;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;

	public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
		this.notificationRepository = notificationRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<NotificationResponse> listMine(boolean unreadOnly) {
		UUID userId = SecurityUtils.currentUser().getId();
		List<Notification> list = unreadOnly
				? notificationRepository.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId)
				: notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
		return list.stream().map(NotificationResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public long unreadCount() {
		return notificationRepository.countByUserIdAndReadAtIsNull(SecurityUtils.currentUser().getId());
	}

	@Transactional
	public NotificationResponse markRead(UUID notificationId) {
		UserPrincipal current = SecurityUtils.currentUser();
		Notification n = notificationRepository.findByIdAndUserId(notificationId, current.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Notification introuvable"));
		if (n.getReadAt() == null) {
			n.setReadAt(Instant.now());
		}
		return NotificationResponse.from(n);
	}

	@Transactional
	public int markAllRead() {
		return notificationRepository.markAllRead(SecurityUtils.currentUser().getId(), Instant.now());
	}

	@Transactional
	public void notifyTaskAssigned(UUID assigneeId, UUID actorId, String taskTitle, UUID projectId) {
		if (assigneeId == null || assigneeId.equals(actorId)) {
			return;
		}
		String title = "Tâche assignée";
		String body = "« " + truncate(taskTitle, 80) + " » t’a été assignée.";
		String link = "/projects/" + projectId + "/tasks";
		notificationRepository.save(new Notification(
				assigneeId,
				NotificationType.TASK_ASSIGNED,
				title,
				body,
				link));
	}

	@Transactional
	public void notifyAnnouncementPinned(UUID announcementId, String announcementTitle, UUID authorId) {
		List<User> recipients = userRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();
		String title = "Annonce urgente";
		String body = "« " + truncate(announcementTitle, 80) + " » a été épinglée.";
		String link = "/announcements/" + announcementId;
		for (User user : recipients) {
			if (user.getId().equals(authorId)) {
				continue;
			}
			notificationRepository.save(new Notification(
					user.getId(),
					NotificationType.ANNOUNCEMENT_PINNED,
					title,
					body,
					link));
		}
	}

	private static String truncate(String value, int max) {
		if (value == null) {
			return "";
		}
		String trimmed = value.trim();
		if (trimmed.length() <= max) {
			return trimmed;
		}
		return trimmed.substring(0, max - 1) + "…";
	}
}
