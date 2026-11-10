package ma.ensem.jee.platform.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePoleRequest(
		@NotBlank @Size(max = 120) String name,
		@Size(max = 5000) String description) {
}
