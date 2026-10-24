package ma.ensem.jee.platform.notification;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ma.ensem.jee.platform.notification.dto.NotificationResponse;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

	private final NotificationService notificationService;

	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	@GetMapping
	public List<NotificationResponse> list(
			@RequestParam(defaultValue = "false") boolean unreadOnly) {
		return notificationService.listMine(unreadOnly);
	}

	@GetMapping("/unread-count")
	public Map<String, Long> unreadCount() {
		return Map.of("count", notificationService.unreadCount());
	}

	@PostMapping("/{id}/read")
	public NotificationResponse markRead(@PathVariable UUID id) {
		return notificationService.markRead(id);
	}

	@PostMapping("/read-all")
	public Map<String, Integer> markAllRead() {
		return Map.of("updated", notificationService.markAllRead());
	}
}
