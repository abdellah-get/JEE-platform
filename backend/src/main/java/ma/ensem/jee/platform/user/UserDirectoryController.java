package ma.ensem.jee.platform.user;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ma.ensem.jee.platform.user.dto.UserSummaryResponse;

@RestController
@RequestMapping("/api/v1/users")
public class UserDirectoryController {

	private final UserRepository userRepository;

	public UserDirectoryController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	/** Annuaire club (membres actifs) — pour composer les équipes projet. */
	@GetMapping
	public List<UserSummaryResponse> listActive() {
		return userRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc().stream()
				.map(UserSummaryResponse::from)
				.toList();
	}
}