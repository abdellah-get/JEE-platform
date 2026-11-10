package ma.ensem.jee.platform.notification;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.user.ClubRole;

@RestController
@RequestMapping("/api/v1/admin/digest")
public class DigestController {

	private final DigestService digestService;

	public DigestController(DigestService digestService) {
		this.digestService = digestService;
	}

	@PostMapping("/run")
	@ResponseStatus(HttpStatus.OK)
	public Map<String, Object> runNow() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.ADMIN_TECH && current.getClubRole() != ClubRole.BUREAU) {
			throw new AccessDeniedException("Réservé au bureau / admin");
		}
		int sent = digestService.runDigest(true);
		return Map.of("sent", sent);
	}
}
