package ma.ensem.jee.platform.user;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.user.dto.ChangePasswordRequest;
import ma.ensem.jee.platform.user.dto.MeResponse;
import ma.ensem.jee.platform.user.dto.UpdateProfileRequest;

@Service
public class MeService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public MeService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public MeResponse getCurrent() {
		return MeResponse.from(loadCurrentUser());
	}

	@Transactional
	public MeResponse updateProfile(UpdateProfileRequest request) {
		User user = loadCurrentUser();
		user.setFirstName(request.firstName().trim());
		user.setLastName(request.lastName().trim());
		return MeResponse.from(userRepository.save(user));
	}

	@Transactional
	public void changePassword(ChangePasswordRequest request) {
		User user = loadCurrentUser();
		if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
			throw new BadCredentialsException("Mot de passe actuel incorrect");
		}
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		userRepository.save(user);
	}

	private User loadCurrentUser() {
		UserPrincipal principal = SecurityUtils.currentUser();
		return userRepository.findById(principal.getId())
				.orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable"));
	}
}
