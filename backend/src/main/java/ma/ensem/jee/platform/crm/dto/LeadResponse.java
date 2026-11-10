package ma.ensem.jee.platform.crm.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.crm.LeadStatus;

public record LeadResponse(
		UUID id,
		String companyName,
		String contactName,
		String contactEmail,
		LeadStatus status,
		String notes,
		UUID ownerId,
		Instant createdAt,
		Instant updatedAt) {
}
