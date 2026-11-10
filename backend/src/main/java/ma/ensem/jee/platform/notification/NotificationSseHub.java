package ma.ensem.jee.platform.notification;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * In-memory SSE fan-out per user. Suitable for a single Render instance.
 * Multi-instance would need Redis pub/sub — documented in docs/SECURITY.md.
 */
@Component
public class NotificationSseHub {

	private static final Logger log = LoggerFactory.getLogger(NotificationSseHub.class);

	/** 30 min — clients should reconnect; Render may idle earlier. */
	private static final long TIMEOUT_MS = 30L * 60L * 1000L;

	private final Map<UUID, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

	public SseEmitter subscribe(UUID userId) {
		SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
		emitters.computeIfAbsent(userId, id -> new CopyOnWriteArrayList<>()).add(emitter);

		Runnable cleanup = () -> remove(userId, emitter);
		emitter.onCompletion(cleanup);
		emitter.onTimeout(cleanup);
		emitter.onError(ex -> cleanup.run());

		try {
			emitter.send(SseEmitter.event().name("connected").data("{\"ok\":true}"));
		}
		catch (IOException ex) {
			cleanup.run();
		}
		return emitter;
	}

	public void publishUnread(UUID userId, long unreadCount) {
		List<SseEmitter> list = emitters.get(userId);
		if (list == null || list.isEmpty()) {
			return;
		}
		String payload = "{\"unreadCount\":" + unreadCount + "}";
		for (SseEmitter emitter : list) {
			try {
				emitter.send(SseEmitter.event().name("notifications").data(payload));
			}
			catch (IOException | IllegalStateException ex) {
				remove(userId, emitter);
				log.debug("SSE drop for {}: {}", userId, ex.toString());
			}
		}
	}

	private void remove(UUID userId, SseEmitter emitter) {
		CopyOnWriteArrayList<SseEmitter> list = emitters.get(userId);
		if (list != null) {
			list.remove(emitter);
			if (list.isEmpty()) {
				emitters.remove(userId, list);
			}
		}
		try {
			emitter.complete();
		}
		catch (Exception ignored) {
			// already completed
		}
	}
}
