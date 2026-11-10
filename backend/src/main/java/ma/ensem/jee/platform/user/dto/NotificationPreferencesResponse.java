package ma.ensem.jee.platform.user.dto;

import ma.ensem.jee.platform.user.DigestFrequency;
import ma.ensem.jee.platform.user.User;

public record NotificationPreferencesResponse(
		boolean emailDigestEnabled,
		DigestFrequency digestFrequency,
		boolean notifyTaskAssigned,
		boolean notifyAnnouncementPinned,
		boolean notifyEventPinned) {

	public static NotificationPreferencesResponse from(User user) {
		return new NotificationPreferencesResponse(
				user.isEmailDigestEnabled(),
				user.getDigestFrequency(),
				user.isNotifyTaskAssigned(),
				user.isNotifyAnnouncementPinned(),
				user.isNotifyEventPinned());
	}
}
