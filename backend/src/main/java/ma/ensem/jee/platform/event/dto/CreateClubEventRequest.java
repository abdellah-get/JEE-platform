package ma.ensem.jee.platform.event.dto;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateClubEventRequest(
		@NotBlank @Size(max = 200) String title,
		@NotBlank @Size(max = 10000) String description,
		@Size(max = 255) String location,
		@NotNull Instant startsAt,
		Instant endsAt,
		Boolean pinned) {
}
