package ma.ensem.jee.platform.finance.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.finance.ExpenseCategory;

public record CreateExpenseClaimRequest(
		@NotNull ExpenseCategory category,
		@NotNull @Min(1) Long amountCents,
		@NotBlank @Size(max = 500) String description,
		@Size(max = 500) String receiptNote) {
}
