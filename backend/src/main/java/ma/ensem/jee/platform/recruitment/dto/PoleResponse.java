package ma.ensem.jee.platform.recruitment.dto;

import java.time.Instant;
import java.util.UUID;

public record PoleResponse(
		UUID id,
		String name,
		String description,
		boolean active,
		Instant createdAt,
		Instant updatedAt) {
}
