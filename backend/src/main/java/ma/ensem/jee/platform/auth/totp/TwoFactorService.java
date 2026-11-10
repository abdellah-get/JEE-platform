package ma.ensem.jee.platform.auth.totp;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.AuthService;
import ma.ensem.jee.platform.auth.JwtService;
import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.TokenHashes;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.auth.totp.dto.TotpConfirmRequest;
import ma.ensem.jee.platform.auth.totp.dto.TotpSetupResponse;
import ma.ensem.jee.platform.auth.totp.dto.TotpStatusResponse;
import ma.ensem.jee.platform.auth.totp.dto.VerifyTwoFactorRequest;
import ma.ensem.jee.platform.common.BadRequestException;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class TwoFactorService {

	private static final String ISSUER = "JEE Platform";

	private final UserRepository userRepository;
	private final TotpService totpService;
	private final TotpRecoveryCodeRepository recoveryCodeRepository;
	private final JwtService jwtService;
	private final AuthService authService;

	public TwoFactorService(
			UserRepository userRepository,
			TotpService totpService,
			TotpRecoveryCodeRepository recoveryCodeRepository,
			JwtService jwtService,
			@Lazy AuthService authService) {
		this.userRepository = userRepository;
		this.totpService = totpService;
		this.recoveryCodeRepository = recoveryCodeRepository;
		this.jwtService = jwtService;
		this.authService = authService;
	}

	@Transactional(readOnly = true)
	public TotpStatusResponse status() {
		User user = currentUserEntity();
		return new TotpStatusResponse(
				user.isTotpEnabled(),
				user.getTotpSecret() != null && !user.isTotpEnabled(),
				recoveryCodeRepository.countByUserIdAndUsedAtIsNull(user.getId()));
	}

	@Transactional
	public TotpSetupResponse beginSetup() {
		User user = currentUserEntity();
		if (user.isTotpEnabled()) {
			throw new BadRequestException("2FA déjà activée. Désactive-la d’abord pour recommencer.");
		}
		String secret = totpService.generateSecret();
		user.setTotpSecret(secret);
		user.setTotpEnabled(false);
		user.setTotpConfirmedAt(null);
		recoveryCodeRepository.deleteByUserId(user.getId());
		String[] rawCodes = totpService.generateRecoveryCodes(8);
		for (String code : rawCodes) {
			recoveryCodeRepository.save(new TotpRecoveryCode(user.getId(), TokenHashes.sha256(code)));
		}
		return new TotpSetupResponse(
				secret,
				totpService.otpAuthUri(user.getEmail(), secret, ISSUER),
				Arrays.asList(rawCodes));
	}

	@Transactional
	public TotpStatusResponse confirmSetup(TotpConfirmRequest request) {
		User user = currentUserEntity();
		if (user.getTotpSecret() == null) {
			throw new BadRequestException("Démarre d’abord la configuration 2FA");
		}
		if (!totpService.verify(user.getTotpSecret(), request.code())) {
			throw new BadRequestException("Code TOTP invalide");
		}
		user.setTotpEnabled(true);
		user.setTotpConfirmedAt(Instant.now());
		return status();
	}

	@Transactional
	public TotpStatusResponse disable(TotpConfirmRequest request) {
		User user = currentUserEntity();
		if (!user.isTotpEnabled()) {
			throw new BadRequestException("2FA n’est pas activée");
		}
		if (!totpService.verify(user.getTotpSecret(), request.code())
				&& !consumeRecoveryCode(user.getId(), request.code())) {
			throw new BadRequestException("Code invalide");
		}
		user.setTotpSecret(null);
		user.setTotpEnabled(false);
		user.setTotpConfirmedAt(null);
		recoveryCodeRepository.deleteByUserId(user.getId());
		return status();
	}

	@Transactional
	public AuthService.AuthResult verifyLogin(VerifyTwoFactorRequest request) {
		UUID userId;
		try {
			var claims = jwtService.parseClaims(request.preAuthToken());
			if (!jwtService.isPreAuthToken(claims)) {
				throw new BadCredentialsException("Jeton 2FA invalide");
			}
			userId = jwtService.getUserId(claims);
		}
		catch (Exception ex) {
			throw new BadCredentialsException("Jeton 2FA invalide ou expiré");
		}
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new BadCredentialsException("Jeton 2FA invalide"));
		if (!user.isActive() || !user.isTotpEnabled()) {
			throw new BadCredentialsException("2FA non disponible");
		}
		boolean ok = totpService.verify(user.getTotpSecret(), request.code())
				|| consumeRecoveryCode(user.getId(), request.code());
		if (!ok) {
			throw new BadCredentialsException("Code 2FA incorrect");
		}
		return authService.completeLoginAfterTwoFactor(user);
	}

	private boolean consumeRecoveryCode(UUID userId, String code) {
		String normalized = code == null ? "" : code.trim().replace(" ", "");
		if (!normalized.matches("\\d{8}")) {
			return false;
		}
		String hash = TokenHashes.sha256(normalized);
		List<TotpRecoveryCode> codes = recoveryCodeRepository.findByUserIdAndUsedAtIsNull(userId);
		for (TotpRecoveryCode stored : codes) {
			if (stored.getCodeHash().equals(hash)) {
				stored.markUsed();
				return true;
			}
		}
		return false;
	}

	private User currentUserEntity() {
		UserPrincipal principal = SecurityUtils.currentUser();
		return userRepository.findById(principal.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
	}
}
