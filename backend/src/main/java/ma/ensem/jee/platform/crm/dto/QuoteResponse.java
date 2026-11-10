package ma.ensem.jee.platform.crm.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import ma.ensem.jee.platform.crm.QuoteStatus;

public record QuoteResponse(
		UUID id,
		UUID missionId,
		long amountCents,
		String currency,
		QuoteStatus status,
		LocalDate validUntil,
		String notes,
		Instant createdAt,
		Instant updatedAt) {
}
