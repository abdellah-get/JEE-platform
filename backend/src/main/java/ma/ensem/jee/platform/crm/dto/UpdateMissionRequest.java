package ma.ensem.jee.platform.crm.dto;

import java.util.UUID;

import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.crm.MissionStatus;

public record UpdateMissionRequest(
		UUID leadId,
		UUID projectId,
		@Size(max = 200) String title,
		@Size(max = 10000) String description,
		MissionStatus status,
		Boolean clearLead,
		Boolean clearProject) {
}
