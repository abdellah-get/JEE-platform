package ma.ensem.jee.platform.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.auth.dto.AuthResponse;
import ma.ensem.jee.platform.auth.dto.ForgotPasswordRequest;
import ma.ensem.jee.platform.auth.dto.LoginRequest;
import ma.ensem.jee.platform.auth.dto.MessageResponse;
import ma.ensem.jee.platform.auth.dto.RegisterRequest;
import ma.ensem.jee.platform.auth.dto.ResetPasswordRequest;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private static final String FORGOT_RESPONSE =
			"Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.";

	private final AuthService authService;
	private final PasswordResetService passwordResetService;

	public AuthController(AuthService authService, PasswordResetService passwordResetService) {
		this.authService = authService;
		this.passwordResetService = passwordResetService;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
		AuthService.AuthResult result = authService.register(request);
		HttpHeaders headers = new HttpHeaders();
		result.applyCookie(headers);
		return ResponseEntity.status(HttpStatus.CREATED).headers(headers).body(result.body());
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		AuthService.AuthResult result = authService.login(request);
		HttpHeaders headers = new HttpHeaders();
		result.applyCookie(headers);
		return ResponseEntity.ok().headers(headers).body(result.body());
	}

	@PostMapping("/refresh")
	public ResponseEntity<AuthResponse> refresh(
			@CookieValue(name = AuthService.REFRESH_COOKIE, required = false) String refreshToken) {
		AuthService.AuthResult result = authService.refresh(refreshToken);
		HttpHeaders headers = new HttpHeaders();
		result.applyCookie(headers);
		return ResponseEntity.ok().headers(headers).body(result.body());
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout() {
		HttpHeaders headers = new HttpHeaders();
		headers.add(HttpHeaders.SET_COOKIE, authService.clearRefreshCookie().toString());
		return ResponseEntity.noContent().headers(headers).build();
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		passwordResetService.forgotPassword(request);
		return ResponseEntity.ok(new MessageResponse(FORGOT_RESPONSE));
	}

	@PostMapping("/reset-password")
	public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		passwordResetService.resetPassword(request);
		return ResponseEntity.ok(new MessageResponse("Mot de passe mis à jour. Tu peux te connecter."));
	}
}
