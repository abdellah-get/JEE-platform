package ma.ensem.jee.platform.recruitment.dto;

import jakarta.validation.constraints.Size;

public record UpdatePoleRequest(
		@Size(max = 120) String name,
		@Size(max = 5000) String description,
		Boolean active) {
}
