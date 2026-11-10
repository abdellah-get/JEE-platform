package ma.ensem.jee.platform.crm.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import ma.ensem.jee.platform.crm.MissionStatus;

public record MissionResponse(
		UUID id,
		UUID leadId,
		String leadCompanyName,
		UUID projectId,
		String projectName,
		String title,
		String description,
		MissionStatus status,
		UUID ownerId,
		List<QuoteResponse> quotes,
		List<ContractResponse> contracts,
		Instant createdAt,
		Instant updatedAt) {
}
