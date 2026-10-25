package ma.ensem.jee.platform.event.dto;

import java.time.Instant;

import jakarta.validation.constraints.Size;

public record UpdateClubEventRequest(
		@Size(max = 200) String title,
		@Size(max = 10000) String description,
		@Size(max = 255) String location,
		Instant startsAt,
		Instant endsAt,
		Boolean clearEndsAt,
		Boolean pinned) {
}
