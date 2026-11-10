package ma.ensem.jee.platform.crm.dto;

import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.crm.LeadStatus;

public record UpdateLeadRequest(
		@Size(max = 200) String companyName,
		@Size(max = 200) String contactName,
		@Size(max = 255) String contactEmail,
		LeadStatus status,
		@Size(max = 10000) String notes) {
}
