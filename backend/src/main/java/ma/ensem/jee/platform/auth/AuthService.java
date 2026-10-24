package ma.ensem.jee.platform.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import ma.ensem.jee.platform.auth.dto.AuthResponse;
import ma.ensem.jee.platform.auth.dto.LoginRequest;
import ma.ensem.jee.platform.auth.dto.RegisterRequest;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class AuthService {

	public static final String REFRESH_COOKIE = "refresh_token";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;

	public AuthService(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			AuthenticationManager authenticationManager) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authenticationManager = authenticationManager;
	}

	@Transactional
	public AuthResult register(RegisterRequest request) {
		if (userRepository.existsByEmailIgnoreCase(request.email())) {
			throw new IllegalArgumentException("Email déjà utilisé");
		}

		User user = new User(
				request.email().trim().toLowerCase(),
				passwordEncoder.encode(request.password()),
				request.firstName().trim(),
				request.lastName().trim(),
				ClubRole.MEMBRE);

		userRepository.save(user);
		return buildAuthResult(user);
	}

	@Transactional(readOnly = true)
	public AuthResult login(LoginRequest request) {
		try {
			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(
							request.email().trim().toLowerCase(),
							request.password()));
		}
		catch (BadCredentialsException ex) {
			throw new BadCredentialsException("Email ou mot de passe incorrect");
		}

		User user = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
				.orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect"));

		if (!user.isActive()) {
			throw new BadCredentialsException("Compte désactivé");
		}

		return buildAuthResult(user);
	}

	@Transactional(readOnly = true)
	public AuthResult refresh(String refreshToken) {
		if (refreshToken == null || refreshToken.isBlank()) {
			throw new BadCredentialsException("Refresh token manquant");
		}

		try {
			Claims claims = jwtService.parseClaims(refreshToken);
			if (!jwtService.isRefreshToken(claims)) {
				throw new BadCredentialsException("Refresh token invalide");
			}

			User user = userRepository.findById(jwtService.getUserId(claims))
					.orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable"));

			if (!user.isActive()) {
				throw new BadCredentialsException("Compte désactivé");
			}

			return buildAuthResult(user);
		}
		catch (JwtException | IllegalArgumentException ex) {
			throw new BadCredentialsException("Refresh token invalide");
		}
	}

	public ResponseCookie clearRefreshCookie() {
		return ResponseCookie.from(REFRESH_COOKIE, "")
				.httpOnly(true)
				.secure(jwtService.isCookieSecure())
				.path("/api/v1/auth")
				.maxAge(0)
				.sameSite("Lax")
				.build();
	}

	private AuthResult buildAuthResult(User user) {
		String access = jwtService.createAccessToken(user);
		String refresh = jwtService.createRefreshToken(user);

		ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, refresh)
				.httpOnly(true)
				.secure(jwtService.isCookieSecure())
				.path("/api/v1/auth")
				.maxAge(jwtService.getRefreshTokenDays() * 24 * 60 * 60)
				.sameSite("Lax")
				.build();

		AuthResponse body = new AuthResponse(
				access,
				"Bearer",
				jwtService.getAccessTokenMinutes(),
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getClubRole());

		return new AuthResult(body, cookie);
	}

	public record AuthResult(AuthResponse body, ResponseCookie refreshCookie) {
		public void applyCookie(HttpHeaders headers) {
			headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());
		}
	}
}
