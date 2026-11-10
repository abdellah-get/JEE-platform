package ma.ensem.jee.platform.notification;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.notification.dto.NotificationResponse;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final UserRepository userRepository;
	private final NotificationSseHub sseHub;

	public NotificationService(
			NotificationRepository notificationRepository,
			UserRepository userRepository,
			NotificationSseHub sseHub) {
		this.notificationRepository = notificationRepository;
		this.userRepository = userRepository;
		this.sseHub = sseHub;
	}

	@Transactional(readOnly = true)
	public PageResponse<NotificationResponse> listMine(boolean unreadOnly, int page, int size) {
		UUID userId = SecurityUtils.currentUser().getId();
		var pageable = PageResponse.toPageable(page, size);
		Page<Notification> list = unreadOnly
				? notificationRepository.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId, pageable)
				: notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
		return PageResponse.from(list.map(NotificationResponse::from));
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
		User assignee = userRepository.findById(assigneeId).orElse(null);
		if (assignee == null || !assignee.isNotifyTaskAssigned()) {
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
		publishUnread(assigneeId);
	}

	@Transactional
	public void notifyAnnouncementPinned(UUID announcementId, String announcementTitle, UUID authorId) {
		List<User> recipients = userRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();
		String title = "Annonce urgente";
		String body = "« " + truncate(announcementTitle, 80) + " » a été épinglée.";
		String link = "/announcements/" + announcementId;
		List<Notification> batch = recipients.stream()
				.filter(user -> !user.getId().equals(authorId))
				.filter(User::isNotifyAnnouncementPinned)
				.map(user -> new Notification(
						user.getId(),
						NotificationType.ANNOUNCEMENT_PINNED,
						title,
						body,
						link))
				.toList();
		if (!batch.isEmpty()) {
			notificationRepository.saveAll(batch);
			batch.stream().map(Notification::getUserId).distinct().forEach(this::publishUnread);
		}
	}

	@Transactional
	public void notifyEventPinned(UUID eventId, String eventTitle, UUID authorId) {
		List<User> recipients = userRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();
		String title = "Événement à retenir";
		String body = "« " + truncate(eventTitle, 80) + " » a été épinglé.";
		String link = "/events/" + eventId;
		List<Notification> batch = recipients.stream()
				.filter(user -> !user.getId().equals(authorId))
				.filter(User::isNotifyEventPinned)
				.map(user -> new Notification(
						user.getId(),
						NotificationType.EVENT_PINNED,
						title,
						body,
						link))
				.toList();
		if (!batch.isEmpty()) {
			notificationRepository.saveAll(batch);
			batch.stream().map(Notification::getUserId).distinct().forEach(this::publishUnread);
		}
	}

	@Transactional
	public void notifyEventRsvp(
			UUID creatorId,
			UUID actorId,
			String actorName,
			UUID eventId,
			String eventTitle,
			String status) {
		if (creatorId == null || creatorId.equals(actorId)) {
			return;
		}
		String title = "Nouvelle réponse RSVP";
		String body = actorName + " a répondu « " + statusLabel(status) + " » à « "
				+ truncate(eventTitle, 60) + " ».";
		String link = "/events/" + eventId;
		notificationRepository.save(new Notification(
				creatorId,
				NotificationType.EVENT_RSVP,
				title,
				body,
				link));
		publishUnread(creatorId);
	}

	public org.springframework.web.servlet.mvc.method.annotation.SseEmitter openStream() {
		UUID userId = SecurityUtils.currentUser().getId();
		return sseHub.subscribe(userId);
	}

	private void publishUnread(UUID userId) {
		long count = notificationRepository.countByUserIdAndReadAtIsNull(userId);
		sseHub.publishUnread(userId, count);
	}

	private static String statusLabel(String status) {
		return switch (status) {
			case "GOING" -> "Présent";
			case "MAYBE" -> "Peut-être";
			case "DECLINED" -> "Absent";
			default -> status;
		};
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
