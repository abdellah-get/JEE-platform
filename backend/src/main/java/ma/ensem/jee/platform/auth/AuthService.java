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
import ma.ensem.jee.platform.recruitment.RecruitmentService;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.MembershipStatus;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class AuthService {

	public static final String REFRESH_COOKIE = "refresh_token";

	private static final String PENDING_MESSAGE =
			"Inscription bien reçue. Ta demande va être traitée par le bureau. Tu pourras accéder à la plateforme une fois qu’elle sera acceptée.";

	private static final String INVALID_CREDENTIALS = "Email ou mot de passe incorrect";

	private static final String PENDING_LOGIN =
			"Compte en attente. Ta demande est en cours de traitement par le bureau.";

	private static final String REJECTED_LOGIN =
			"Ta demande d’adhésion a été refusée par le bureau.";

	private static final String INACTIVE_LOGIN = "Compte désactivé";

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;
	private final RegistrationProperties registrationProperties;
	private final RecruitmentService recruitmentService;

	public AuthService(
			UserRepository userRepository,
			RefreshTokenRepository refreshTokenRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			AuthenticationManager authenticationManager,
			RegistrationProperties registrationProperties,
			RecruitmentService recruitmentService) {
		this.userRepository = userRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.authenticationManager = authenticationManager;
		this.registrationProperties = registrationProperties;
		this.recruitmentService = recruitmentService;
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

		String lastName = request.lastName();
		if (lastName == null || lastName.isBlank()) {
			lastName = "";
		}
		else {
			lastName = lastName.trim();
		}

		User user = new User(
				email,
				passwordEncoder.encode(request.password()),
				request.firstName().trim(),
				lastName,
				ClubRole.MEMBRE);

		if (registrationProperties.isRequireApproval()) {
			user.setActive(false);
			user.setMembershipStatus(MembershipStatus.PENDING);
			userRepository.save(user);
			recruitmentService.ensureEntryForPendingUser(user.getId());
			return RegisterOutcome.pending(RegisterResponse.pending(PENDING_MESSAGE));
		}

		userRepository.save(user);
		return RegisterOutcome.authenticated(buildAuthResult(user));
	}

	@Transactional
	public AuthResult login(LoginRequest request) {
		String email = request.email().trim().toLowerCase();
		try {
			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(email, request.password()));
		}
		catch (DisabledException | LockedException ex) {
			throw credentialsForInactiveAccount(email, request.password());
		}
		catch (BadCredentialsException ex) {
			throw new BadCredentialsException(INVALID_CREDENTIALS);
		}

		User user = userRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS));

		if (!user.isActive()) {
			throw new BadCredentialsException(messageForInactive(user));
		}

		if (user.isTotpEnabled()) {
			String preAuth = jwtService.createPreAuthToken(user);
			return AuthResult.challenge(AuthResponse.twoFactorChallenge(user.getId(), user.getEmail(), preAuth));
		}

		return buildAuthResult(user);
	}

	@Transactional
	public AuthResult completeLoginAfterTwoFactor(User user) {
		if (!user.isActive()) {
			throw new BadCredentialsException(INACTIVE_LOGIN);
		}
		return buildAuthResult(user);
	}

	/**
	 * Inactive accounts fail {@code isAccountNonLocked} before Spring compares the password.
	 * Check it here so a wrong password stays indistinguishable from an unknown email.
	 */
	private BadCredentialsException credentialsForInactiveAccount(String email, String rawPassword) {
		User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
		if (user == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
			return new BadCredentialsException(INVALID_CREDENTIALS);
		}
		return new BadCredentialsException(messageForInactive(user));
	}

	private static String messageForInactive(User user) {
		MembershipStatus status = user.getMembershipStatus();
		if (status == MembershipStatus.PENDING) {
			return PENDING_LOGIN;
		}
		if (status == MembershipStatus.REJECTED) {
			return REJECTED_LOGIN;
		}
		return INACTIVE_LOGIN;
	}

	/**
	 * BadCredentials must not roll back token revocations (reuse → family revoke,
	 * expired / inactive revoke markers).
	 */
	@Transactional(noRollbackFor = BadCredentialsException.class)
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

		String hash = TokenHashes.sha256(refreshToken);
		RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
				.orElseThrow(() -> new BadCredentialsException("Refresh token invalide ou révoqué"));

		// Reuse of a rotated/revoked token → revoke the whole session family
		if (stored.isRevoked()) {
			refreshTokenRepository.revokeAllForUser(stored.getUser().getId(), Instant.now());
			throw new BadCredentialsException("Refresh token réutilisé — sessions révoquées");
		}

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

		AuthResponse body = AuthResponse.session(
				access,
				jwtService.getAccessTokenMinutes(),
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getClubRole());

		return new AuthResult(body, cookie);
	}

	public record AuthResult(AuthResponse body, ResponseCookie refreshCookie) {
		static AuthResult challenge(AuthResponse body) {
			return new AuthResult(body, null);
		}

		public void applyCookie(HttpHeaders headers) {
			if (refreshCookie != null) {
				headers.add(HttpHeaders.SET_COOKIE, refreshCookie.toString());
			}
		}

		public boolean isTwoFactorChallenge() {
			return Boolean.TRUE.equals(body.requiresTwoFactor());
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
