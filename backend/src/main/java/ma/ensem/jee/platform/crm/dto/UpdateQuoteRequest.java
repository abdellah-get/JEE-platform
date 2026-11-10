package ma.ensem.jee.platform.crm.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.crm.QuoteStatus;

public record UpdateQuoteRequest(
		@Min(0) Long amountCents,
		@Size(max = 8) String currency,
		QuoteStatus status,
		LocalDate validUntil,
		@Size(max = 10000) String notes) {
}
