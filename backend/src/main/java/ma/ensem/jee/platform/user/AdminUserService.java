package ma.ensem.jee.platform.user;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.user.dto.AdminUserResponse;
import ma.ensem.jee.platform.user.dto.UpdateClubRoleRequest;
import ma.ensem.jee.platform.user.dto.UpdateUserActiveRequest;

@Service
public class AdminUserService {

	private final UserRepository userRepository;

	public AdminUserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<AdminUserResponse> listAll() {
		requireBureauOrAdmin();
		return userRepository.findAllByOrderByLastNameAscFirstNameAsc().stream()
				.map(AdminUserResponse::from)
				.toList();
	}

	@Transactional
	public AdminUserResponse updateActive(UUID userId, UpdateUserActiveRequest request) {
		UserPrincipal current = requireBureauOrAdmin();
		User target = userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

		if (target.getId().equals(current.getId()) && Boolean.FALSE.equals(request.active())) {
			throw new IllegalArgumentException("Tu ne peux pas désactiver ton propre compte");
		}

		if (Boolean.FALSE.equals(request.active())
				&& target.getClubRole() == ClubRole.ADMIN_TECH
				&& userRepository.countByClubRoleAndActiveTrue(ClubRole.ADMIN_TECH) <= 1) {
			throw new IllegalArgumentException("Impossible de désactiver le dernier admin technique actif");
		}

		target.setActive(Boolean.TRUE.equals(request.active()));
		return AdminUserResponse.from(target);
	}

	@Transactional
	public AdminUserResponse updateRole(UUID userId, UpdateClubRoleRequest request) {
		UserPrincipal current = requireAdminTech();
		User target = userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

		ClubRole newRole = request.clubRole();
		if (target.getId().equals(current.getId()) && newRole != ClubRole.ADMIN_TECH) {
			throw new IllegalArgumentException("Tu ne peux pas retirer ton propre rôle ADMIN_TECH");
		}

		if (target.getClubRole() == ClubRole.ADMIN_TECH
				&& newRole != ClubRole.ADMIN_TECH
				&& target.isActive()
				&& userRepository.countByClubRoleAndActiveTrue(ClubRole.ADMIN_TECH) <= 1) {
			throw new IllegalArgumentException("Impossible de rétrograder le dernier admin technique actif");
		}

		target.setClubRole(newRole);
		return AdminUserResponse.from(target);
	}

	private UserPrincipal requireBureauOrAdmin() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.BUREAU && current.getClubRole() != ClubRole.ADMIN_TECH) {
			throw new AccessDeniedException("Réservé au bureau ou à l'admin technique");
		}
		return current;
	}

	private UserPrincipal requireAdminTech() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.ADMIN_TECH) {
			throw new AccessDeniedException("Seul l'admin technique peut modifier les rôles club");
		}
		return current;
	}
}
