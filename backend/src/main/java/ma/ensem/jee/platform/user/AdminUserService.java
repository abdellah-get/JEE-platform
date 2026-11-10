package ma.ensem.jee.platform.user;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.user.dto.AdminUserResponse;
import ma.ensem.jee.platform.user.dto.DecideMembershipRequest;
import ma.ensem.jee.platform.user.dto.MembershipDecision;
import ma.ensem.jee.platform.user.dto.UpdateClubRoleRequest;
import ma.ensem.jee.platform.user.dto.UpdateUserActiveRequest;

@Service
public class AdminUserService {

	private final UserRepository userRepository;

	public AdminUserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public PageResponse<AdminUserResponse> listAll(MembershipStatus membership, int page, int size) {
		requireBureauOrAdmin();
		var pageable = PageResponse.toPageable(page, size);
		Page<User> users = membership == null
				? userRepository.findAllByOrderByLastNameAscFirstNameAsc(pageable)
				: userRepository.findByMembershipStatusOrderByLastNameAscFirstNameAsc(membership, pageable);
		return PageResponse.from(users.map(AdminUserResponse::from));
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

		boolean active = Boolean.TRUE.equals(request.active());
		target.setActive(active);
		if (active) {
			target.setMembershipStatus(MembershipStatus.APPROVED);
		}
		else if (target.getMembershipStatus() == MembershipStatus.PENDING) {
			target.setMembershipStatus(MembershipStatus.REJECTED);
		}
		return AdminUserResponse.from(target);
	}

	@Transactional
	public AdminUserResponse decideMembership(UUID userId, DecideMembershipRequest request) {
		UserPrincipal current = requireBureauOrAdmin();
		User target = userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

		if (target.getId().equals(current.getId())) {
			throw new IllegalArgumentException("Tu ne peux pas décider de ton propre compte");
		}

		if (request.decision() == MembershipDecision.APPROVE) {
			target.setMembershipStatus(MembershipStatus.APPROVED);
			target.setActive(true);
		}
		else if (request.decision() == MembershipDecision.REJECT) {
			target.setMembershipStatus(MembershipStatus.REJECTED);
			target.setActive(false);
		}
		else {
			throw new IllegalArgumentException("Décision invalide");
		}
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
