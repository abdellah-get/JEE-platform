package ma.ensem.jee.platform.event.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.event.ClubEvent;

public record ClubEventResponse(
		UUID id,
		String title,
		String description,
		String location,
		Instant startsAt,
		Instant endsAt,
		boolean pinned,
		UUID createdById,
		String createdByName,
		Instant createdAt,
		Instant updatedAt) {

	public static ClubEventResponse from(ClubEvent event, String createdByName) {
		return new ClubEventResponse(
				event.getId(),
				event.getTitle(),
				event.getDescription(),
				event.getLocation(),
				event.getStartsAt(),
				event.getEndsAt(),
				event.isPinned(),
				event.getCreatedById(),
				createdByName,
				event.getCreatedAt(),
				event.getUpdatedAt());
	}
}
