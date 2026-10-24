package ma.ensem.jee.platform.auth;

import java.io.IOException;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import ma.ensem.jee.platform.user.UserRepository;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtService jwtService;
	private final UserRepository userRepository;

	public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
		this.jwtService = jwtService;
		this.userRepository = userRepository;
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {

		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header == null || !header.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}

		String token = header.substring(7);
		try {
			Claims claims = jwtService.parseClaims(token);
			if (!jwtService.isAccessToken(claims)) {
				filterChain.doFilter(request, response);
				return;
			}

			UUID userId = jwtService.getUserId(claims);
			if (SecurityContextHolder.getContext().getAuthentication() == null) {
				userRepository.findById(userId).ifPresent(user -> {
					if (!user.isActive()) {
						return;
					}
					UserPrincipal principal = new UserPrincipal(user);
					UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
							principal,
							null,
							principal.getAuthorities());
					auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
					SecurityContextHolder.getContext().setAuthentication(auth);
				});
			}
		}
		catch (JwtException | IllegalArgumentException ignored) {
			// Invalid token → leave context empty; Security will return 401 on protected routes
		}

		filterChain.doFilter(request, response);
	}
}
