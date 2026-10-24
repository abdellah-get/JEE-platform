package ma.ensem.jee.platform.auth;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

	private static final Set<String> LIMITED_PATHS = Set.of(
			"/api/v1/auth/login",
			"/api/v1/auth/register",
			"/api/v1/auth/forgot-password");

	private final AuthRateLimiter rateLimiter;
	private final AuthRateLimitProperties properties;

	public AuthRateLimitFilter(AuthRateLimiter rateLimiter, AuthRateLimitProperties properties) {
		this.rateLimiter = rateLimiter;
		this.properties = properties;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if (!properties.isEnabled()) {
			return true;
		}
		if (!HttpMethod.POST.matches(request.getMethod())) {
			return true;
		}
		String path = request.getRequestURI();
		return !LIMITED_PATHS.contains(path);
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		String client = clientKey(request);
		String key = request.getRequestURI() + "|" + client;

		if (!rateLimiter.tryAcquire(key, properties.getMaxRequests(), properties.getWindowSeconds())) {
			response.setStatus(429);
			response.setHeader("Retry-After", String.valueOf(properties.getWindowSeconds()));
			response.setCharacterEncoding(StandardCharsets.UTF_8.name());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write(
					"{\"error\":\"Trop de tentatives. Réessaie dans quelques instants.\"}");
			return;
		}

		filterChain.doFilter(request, response);
	}

	static String clientKey(HttpServletRequest request) {
		String forwarded = request.getHeader("X-Forwarded-For");
		if (forwarded != null && !forwarded.isBlank()) {
			return forwarded.split(",")[0].trim();
		}
		String remote = request.getRemoteAddr();
		return remote != null ? remote : "unknown";
	}
}
