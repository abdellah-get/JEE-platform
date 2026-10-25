package ma.ensem.jee.platform.event.dto;

import java.time.Instant;
import java.util.UUID;

public record CalendarItemResponse(
		String type,
		UUID id,
		String title,
		Instant startsAt,
		Instant endsAt,
		String location,
		String link,
		boolean pinned,
		String meta) {
}
