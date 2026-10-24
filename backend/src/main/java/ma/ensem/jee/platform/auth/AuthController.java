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
import ma.ensem.jee.platform.auth.dto.LoginRequest;
import ma.ensem.jee.platform.auth.dto.RegisterRequest;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
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
}
