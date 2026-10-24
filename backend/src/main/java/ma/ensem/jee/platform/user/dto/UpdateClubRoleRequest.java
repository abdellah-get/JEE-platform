package ma.ensem.jee.platform.user.dto;

import jakarta.validation.constraints.NotNull;
import ma.ensem.jee.platform.user.ClubRole;

public record UpdateClubRoleRequest(@NotNull ClubRole clubRole) {
}
