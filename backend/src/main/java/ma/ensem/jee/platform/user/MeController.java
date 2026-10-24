package ma.ensem.jee.platform.user;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.user.dto.ChangePasswordRequest;
import ma.ensem.jee.platform.user.dto.MeResponse;
import ma.ensem.jee.platform.user.dto.UpdateProfileRequest;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

	private final MeService meService;

	public MeController(MeService meService) {
		this.meService = meService;
	}

	@GetMapping
	public MeResponse me() {
		return meService.getCurrent();
	}

	@PatchMapping
	public MeResponse update(@Valid @RequestBody UpdateProfileRequest request) {
		return meService.updateProfile(request);
	}

	@PostMapping("/password")
	public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
		meService.changePassword(request);
		return ResponseEntity.noContent().build();
	}
}
