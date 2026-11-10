package ma.ensem.jee.platform.crm.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.crm.MissionStatus;

public record CreateMissionRequest(
		UUID leadId,
		UUID projectId,
		@NotBlank @Size(max = 200) String title,
		@Size(max = 10000) String description,
		MissionStatus status) {
}
