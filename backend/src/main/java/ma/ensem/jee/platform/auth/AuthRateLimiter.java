package ma.ensem.jee.platform.auth;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Simple in-memory sliding-window limiter (per key).
 * Suitable for a single-instance club deploy (Render free).
 */
@Component
public class AuthRateLimiter {

	private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

	/**
	 * @return true if the request is allowed
	 */
	public boolean tryAcquire(String key, int maxRequests, int windowSeconds) {
		long now = System.currentTimeMillis();
		long windowStart = now - (windowSeconds * 1000L);

		Deque<Long> timestamps = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
		synchronized (timestamps) {
			while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
				timestamps.pollFirst();
			}
			if (timestamps.size() >= maxRequests) {
				return false;
			}
			timestamps.addLast(now);
			return true;
		}
	}

	/** Test helper — clears all counters. */
	void reset() {
		hits.clear();
	}
}
