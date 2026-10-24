package ma.ensem.jee.platform.user.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserActiveRequest(@NotNull Boolean active) {
}
