package ma.ensem.jee.platform.event.dto;

import jakarta.validation.constraints.NotNull;
import ma.ensem.jee.platform.event.EventRsvpStatus;

public record UpsertEventRsvpRequest(@NotNull EventRsvpStatus status) {
}
