package ma.ensem.jee.platform.user.dto;

import jakarta.validation.constraints.NotNull;
import ma.ensem.jee.platform.user.DigestFrequency;

public record UpdateNotificationPreferencesRequest(
		@NotNull Boolean emailDigestEnabled,
		@NotNull DigestFrequency digestFrequency,
		@NotNull Boolean notifyTaskAssigned,
		@NotNull Boolean notifyAnnouncementPinned,
		@NotNull Boolean notifyEventPinned) {
}
