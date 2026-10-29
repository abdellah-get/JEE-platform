package ma.ensem.jee.platform.user.dto;

import jakarta.validation.constraints.NotNull;

public record DecideMembershipRequest(@NotNull MembershipDecision decision) {
}
