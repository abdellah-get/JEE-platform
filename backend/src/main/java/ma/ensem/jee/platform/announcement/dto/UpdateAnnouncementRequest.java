package ma.ensem.jee.platform.announcement.dto;

import jakarta.validation.constraints.Size;

public record UpdateAnnouncementRequest(
		@Size(max = 200) String title,
		@Size(max = 10000) String body,
		Boolean pinned) {
}
