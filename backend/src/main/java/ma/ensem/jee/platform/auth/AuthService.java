package ma.ensem.jee.platform.auth;

import java.time.Instant;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import ma.ensem.jee.platform.auth.dto.AuthResponse;
import ma.ensem.jee.platform.auth.dto.LoginRequest;
import ma.ensem.jee.platform.auth.dto.RegisterRequest;
import ma.ensem.jee.platform.auth.dto.RegisterResponse;
import ma.ensem.jee.platform.common.BadRequestException;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class AuthService {

	public static final String REFRESH_COOKIE = "refresh_token";

	private static final String PENDING_MESSAGE =
			"Compte créé. Il sera activé par le bureau avant ta première connexion.";

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;
	private final RegistrationProperties registrationProperties;

	public AuthService(
			UserRepository userRepository,
			RefreshTokenRepository refreshTokenRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			AuthenticationManager authenticationManager,
			RegistrationProperties registrationProperties) {
		this.userRepository = userRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authenticationManager = authenticationManager;
		this.registrationProperties = registrationProperties;
	}

	@Transactional
	public RegisterOutcome register(RegisterRequest request) {
		String email = request.email().trim().toLowerCase();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new IllegalArgumentException("Email déjà utilisé");
		}
		if (!registrationProperties.isEmailAllowed(email)) {
			throw new BadRequestException(
					"Inscription réservée aux emails des domaines autorisés ("
							+ String.join(", ", registrationProperties.allowedDomainList())
							+ ").");
		}

		User user = new User(
				email,
				passwordEncoder.encode(request.password()),
				request.firstName().trim(),
				request.lastName().trim(),
				ClubRole.MEMBRE);

		if (registrationProperties.isRequireApproval()) {
			user.setActive(false);
			userRepository.save(user);
			return RegisterOutcome.pending(RegisterResponse.pending(PENDING_MESSAGE));
		}

		userRepository.save(user);
		return RegisterOutcome.authenticated(buildAuthResult(user));
	}

	@Transactional
	public AuthResult login(LoginRequest request) {
		try {
			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(
							request.email().trim().toLowerCase(),
							request.password()));
		}
		catch (DisabledException | LockedException ex) {
			throw new BadCredentialsException("Compte en attente d'activation ou désactivé");
		}
		catch (BadCredentialsException ex) {
			throw new BadCredentialsException("Email ou mot de passe incorrect");
		}

		User user = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
				.orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect"));

		if (!user.isActive()) {
			throw new BadCredentialsException("Compte en attente d'activation ou désactivé");
		}

		return buildAuthResult(user);
	}

	@Transactional
	public AuthResult refresh(String refreshToken) {
		RefreshToken stored = requireActiveRefreshToken(refreshToken);
		User user = stored.getUser();
		if (!user.isActive()) {
			stored.revoke();
			throw new BadCredentialsException("Compte désactivé");
		}

		stored.revoke();
		return buildAuthResult(user);
	}

	@Transactional
	public ResponseCookie logout(String refreshToken) {
		if (refreshToken != null && !refreshToken.isBlank()) {
			refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(TokenHashes.sha256(refreshToken))
					.ifPresent(RefreshToken::revoke);
		}
		return clearRefreshCookie();
	}

	public ResponseCookie clearRefreshCookie() {
		return ResponseCookie.from(REFRESH_COOKIE, "")
				.httpOnly(true)
				.secure(jwtService.isCookieSecure())
				.path("/api/v1/auth")
				.maxAge(0)
				.sameSite(refreshCookieSameSite())
				.build();
	}

	/**
	 * Cross-site front (Vercel) → API (Render) needs SameSite=None + Secure,
	 * otherwise the browser never sends the refresh cookie on fetch/XHR.
	 */
	private String refreshCookieSameSite() {
		return jwtService.isCookieSecure() ? "None" : "Lax";
	}

	private RefreshToken requireActiveRefreshToken(String refreshToken) {
		if (refreshToken == null || refreshToken.isBlank()) {
			throw new BadCredentialsException("Refresh token manquant");
		}

		try {
			Claims claims = jwtService.parseClaims(refreshToken);
			if (!jwtService.isRefreshToken(claims)) {
				throw new BadCredentialsException("Refresh token invalide");
			}
		}
		catch (JwtException | IllegalArgumentException ex) {
			throw new BadCredentialsException("Refresh token invalide");
		}

		RefreshToken stored = refreshTokenRepository
				.findByTokenHashAndRevokedAtIsNull(TokenHashes.sha256(refreshToken))
				.orElseThrow(() -> new BadCredentialsException("Refresh token invalide ou révoqué"));

		if (stored.isExpired(Instant.now())) {
			stored.revoke();
			throw new BadCredentialsException("Refresh token expiré");
		}

		return stored;
	}

	private AuthResult buildAuthResult(User user) {
		String access = jwtService.createAccessToken(user);
		String refresh = jwtService.createRefreshToken(user);
		Instant expiresAt = Instant.now().plusSeconds(jwtService.getRefreshTokenDays() * 24 * 60 * 60);
		refreshTokenRepository.save(new RefreshToken(user, TokenHashes.sha256(refresh), expiresAt));

		ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, refresh)
				.httpOnly(true)
				.secure(jwtService.isCookieSecure())
				.path("/api/v1/auth")
				.maxAge(jwtService.getRefreshTokenDays() * 24 * 60 * 60)
				.sameSite(refreshCookieSameSite())
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

	public record RegisterOutcome(boolean pendingApproval, RegisterResponse response, AuthResult auth) {
		static RegisterOutcome pending(RegisterResponse response) {
			return new RegisterOutcome(true, response, null);
		}

		static RegisterOutcome authenticated(AuthResult auth) {
			return new RegisterOutcome(false, RegisterResponse.authenticated(auth.body()), auth);
		}
	}
}
