package ma.ensem.jee.platform.announcement.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.announcement.Announcement;

public record AnnouncementResponse(
		UUID id,
		String title,
		String body,
		boolean pinned,
		UUID authorId,
		String authorName,
		Instant createdAt,
		Instant updatedAt) {

	public static AnnouncementResponse from(Announcement announcement, String authorName) {
		return new AnnouncementResponse(
				announcement.getId(),
				announcement.getTitle(),
				announcement.getBody(),
				announcement.isPinned(),
				announcement.getAuthorId(),
				authorName,
				announcement.getCreatedAt(),
				announcement.getUpdatedAt());
	}
}
