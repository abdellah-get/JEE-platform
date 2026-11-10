package ma.ensem.jee.platform.crm.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.crm.ContractStatus;

public record ContractResponse(
		UUID id,
		UUID missionId,
		long amountCents,
		String currency,
		ContractStatus status,
		Instant signedAt,
		String notes,
		Instant createdAt,
		Instant updatedAt) {
}
