package ma.ensem.jee.platform.event.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.event.ClubEvent;
import ma.ensem.jee.platform.event.EventRsvpStatus;

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
		Instant updatedAt,
		EventRsvpStatus myRsvp,
		long goingCount,
		long maybeCount,
		long declinedCount) {

	public static ClubEventResponse from(ClubEvent event, String createdByName) {
		return from(event, createdByName, null, 0, 0, 0);
	}

	public static ClubEventResponse from(
			ClubEvent event,
			String createdByName,
			EventRsvpStatus myRsvp,
			long goingCount,
			long maybeCount,
			long declinedCount) {
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
				event.getUpdatedAt(),
				myRsvp,
				goingCount,
				maybeCount,
				declinedCount);
	}
}
