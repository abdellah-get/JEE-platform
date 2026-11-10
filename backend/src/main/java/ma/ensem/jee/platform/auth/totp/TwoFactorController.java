package ma.ensem.jee.platform.auth.totp;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.auth.totp.dto.TotpConfirmRequest;
import ma.ensem.jee.platform.auth.totp.dto.TotpSetupResponse;
import ma.ensem.jee.platform.auth.totp.dto.TotpStatusResponse;

@RestController
@RequestMapping("/api/v1/me/2fa")
public class TwoFactorController {

	private final TwoFactorService twoFactorService;

	public TwoFactorController(TwoFactorService twoFactorService) {
		this.twoFactorService = twoFactorService;
	}

	@GetMapping
	public TotpStatusResponse status() {
		return twoFactorService.status();
	}

	@PostMapping("/setup")
	public TotpSetupResponse setup() {
		return twoFactorService.beginSetup();
	}

	@PostMapping("/confirm")
	public TotpStatusResponse confirm(@Valid @RequestBody TotpConfirmRequest request) {
		return twoFactorService.confirmSetup(request);
	}

	@DeleteMapping
	public TotpStatusResponse disable(@Valid @RequestBody TotpConfirmRequest request) {
		return twoFactorService.disable(request);
	}
}
