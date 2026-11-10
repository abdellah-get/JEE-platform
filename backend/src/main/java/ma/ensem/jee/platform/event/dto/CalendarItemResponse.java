package ma.ensem.jee.platform.event.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.event.EventRsvpStatus;

public record CalendarItemResponse(
		String type,
		UUID id,
		String title,
		Instant startsAt,
		Instant endsAt,
		String location,
		String link,
		boolean pinned,
		String meta,
		EventRsvpStatus myRsvp) {

	public static CalendarItemResponse of(
			String type,
			UUID id,
			String title,
			Instant startsAt,
			Instant endsAt,
			String location,
			String link,
			boolean pinned,
			String meta) {
		return new CalendarItemResponse(type, id, title, startsAt, endsAt, location, link, pinned, meta, null);
	}
}
