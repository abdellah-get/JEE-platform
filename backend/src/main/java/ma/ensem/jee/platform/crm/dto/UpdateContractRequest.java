package ma.ensem.jee.platform.crm.dto;

import java.time.Instant;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.crm.ContractStatus;

public record UpdateContractRequest(
		@Min(0) Long amountCents,
		@Size(max = 8) String currency,
		ContractStatus status,
		Instant signedAt,
		@Size(max = 10000) String notes) {
}
