package ma.ensem.jee.platform.project.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record ReplaceMembersRequest(
		@NotNull List<@Valid ProjectMemberRequest> members) {
}
