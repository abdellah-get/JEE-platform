package ma.ensem.jee.platform.notification.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.notification.Notification;
import ma.ensem.jee.platform.notification.NotificationType;

public record NotificationResponse(
		UUID id,
		NotificationType type,
		String title,
		String body,
		String link,
		boolean read,
		Instant createdAt) {

	public static NotificationResponse from(Notification n) {
		return new NotificationResponse(
				n.getId(),
				n.getType(),
				n.getTitle(),
				n.getBody(),
				n.getLink(),
				n.isRead(),
				n.getCreatedAt());
	}
}
