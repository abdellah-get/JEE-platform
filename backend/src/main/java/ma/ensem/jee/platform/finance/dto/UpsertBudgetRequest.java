package ma.ensem.jee.platform.finance.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpsertBudgetRequest(
		@NotNull @Min(0) Long amountCents,
		@Size(max = 8) String currency) {
}
