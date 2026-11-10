package ma.ensem.jee.platform.event.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.event.EventRsvp;
import ma.ensem.jee.platform.event.EventRsvpStatus;

public record EventRsvpResponse(
		UUID id,
		UUID eventId,
		UUID userId,
		String userName,
		String userEmail,
		EventRsvpStatus status,
		Instant updatedAt) {

	public static EventRsvpResponse from(EventRsvp rsvp, String userName, String userEmail) {
		return new EventRsvpResponse(
				rsvp.getId(),
				rsvp.getEventId(),
				rsvp.getUserId(),
				userName,
				userEmail,
				rsvp.getStatus(),
				rsvp.getUpdatedAt());
	}
}
