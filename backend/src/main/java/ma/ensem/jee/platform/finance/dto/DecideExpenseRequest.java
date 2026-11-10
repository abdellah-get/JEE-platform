package ma.ensem.jee.platform.finance.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.finance.ExpenseClaimStatus;

public record DecideExpenseRequest(
		@NotNull ExpenseClaimStatus status,
		@Size(max = 500) String decisionNote) {
}
