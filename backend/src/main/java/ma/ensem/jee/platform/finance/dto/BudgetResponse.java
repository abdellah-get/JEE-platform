package ma.ensem.jee.platform.finance.dto;

import java.time.Instant;
import java.util.UUID;

public record BudgetResponse(
		UUID projectId,
		String projectName,
		long amountCents,
		String currency,
		long approvedExpensesCents,
		long remainingCents,
		UUID updatedBy,
		Instant updatedAt) {
}
