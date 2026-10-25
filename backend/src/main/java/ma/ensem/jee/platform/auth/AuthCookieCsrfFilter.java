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

/**
 * CSRF mitigation for cookie-authenticated auth endpoints ({@code SameSite=None}).
 * <p>
 * Requires a custom header that triggers a CORS preflight, so a foreign origin cannot
 * forge the call unless it is on the CORS allowlist. When {@code Origin} is present,
 * it must also match {@code app.cors.allowed-origins}.
 */
@Component
public class AuthCookieCsrfFilter extends OncePerRequestFilter {

	public static final String CSRF_HEADER = "X-Requested-With";
	public static final String CSRF_HEADER_VALUE = "XMLHttpRequest";

	private static final Set<String> PROTECTED_PATHS = Set.of(
			"/api/v1/auth/refresh",
			"/api/v1/auth/logout");

	private final CorsProperties corsProperties;

	public AuthCookieCsrfFilter(CorsProperties corsProperties) {
		this.corsProperties = corsProperties;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if (!HttpMethod.POST.matches(request.getMethod())) {
			return true;
		}
		return !PROTECTED_PATHS.contains(request.getRequestURI());
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		if (!CSRF_HEADER_VALUE.equals(request.getHeader(CSRF_HEADER))) {
			reject(response);
			return;
		}

		String origin = request.getHeader("Origin");
		if (origin != null && !origin.isBlank()
				&& !corsProperties.allowedOriginList().contains(origin.trim())) {
			reject(response);
			return;
		}

		filterChain.doFilter(request, response);
	}

	private static void reject(HttpServletResponse response) throws IOException {
		response.setStatus(HttpServletResponse.SC_FORBIDDEN);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write(
				"{\"error\":\"Requête refusée (protection CSRF). Recharge la page.\"}");
	}
}
