package ma.ensem.jee.platform.finance.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.finance.ExpenseCategory;
import ma.ensem.jee.platform.finance.ExpenseClaimStatus;

public record ExpenseClaimResponse(
		UUID id,
		UUID projectId,
		String projectName,
		UUID submitterId,
		String submitterName,
		ExpenseCategory category,
		long amountCents,
		String description,
		ExpenseClaimStatus status,
		String receiptNote,
		UUID decidedBy,
		Instant decidedAt,
		String decisionNote,
		Instant createdAt,
		Instant updatedAt) {
}
