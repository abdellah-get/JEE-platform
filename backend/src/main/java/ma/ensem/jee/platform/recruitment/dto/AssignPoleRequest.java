package ma.ensem.jee.platform.recruitment.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AssignPoleRequest(@NotNull UUID poleId) {
}
