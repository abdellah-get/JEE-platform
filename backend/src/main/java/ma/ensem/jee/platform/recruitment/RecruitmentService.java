package ma.ensem.jee.platform.recruitment;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.audit.AuditService;
import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.BadRequestException;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.recruitment.dto.AssignPoleRequest;
import ma.ensem.jee.platform.recruitment.dto.CreatePoleRequest;
import ma.ensem.jee.platform.recruitment.dto.PoleResponse;
import ma.ensem.jee.platform.recruitment.dto.RecruitmentEntryResponse;
import ma.ensem.jee.platform.recruitment.dto.UpdatePoleRequest;
import ma.ensem.jee.platform.recruitment.dto.UpdateRecruitmentEntryRequest;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.MembershipStatus;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class RecruitmentService {

	private final PoleRepository poleRepository;
	private final UserPoleRepository userPoleRepository;
	private final RecruitmentEntryRepository entryRepository;
	private final UserRepository userRepository;
	private final AuditService auditService;

	public RecruitmentService(
			PoleRepository poleRepository,
			UserPoleRepository userPoleRepository,
			RecruitmentEntryRepository entryRepository,
			UserRepository userRepository,
			AuditService auditService) {
		this.poleRepository = poleRepository;
		this.userPoleRepository = userPoleRepository;
		this.entryRepository = entryRepository;
		this.userRepository = userRepository;
		this.auditService = auditService;
	}

	@Transactional(readOnly = true)
	public List<PoleResponse> listPoles(boolean activeOnly) {
		List<Pole> poles = activeOnly
				? poleRepository.findByActiveTrueOrderByNameAsc()
				: poleRepository.findAllByOrderByNameAsc();
		return poles.stream().map(this::toPole).toList();
	}

	@Transactional
	public PoleResponse createPole(CreatePoleRequest request) {
		requireBureau();
		String name = request.name().trim();
		if (poleRepository.existsByNameIgnoreCase(name)) {
			throw new BadRequestException("Un pôle avec ce nom existe déjà");
		}
		Pole pole = new Pole(name, blankToNull(request.description()));
		poleRepository.save(pole);
		return toPole(pole);
	}

	@Transactional
	public PoleResponse updatePole(UUID id, UpdatePoleRequest request) {
		requireBureau();
		Pole pole = poleRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Pôle introuvable"));
		if (request.name() != null && !request.name().isBlank()) {
			String name = request.name().trim();
			poleRepository.findByNameIgnoreCase(name)
					.filter(p -> !p.getId().equals(id))
					.ifPresent(p -> {
						throw new BadRequestException("Un pôle avec ce nom existe déjà");
					});
			pole.setName(name);
		}
		if (request.description() != null) {
			pole.setDescription(blankToNull(request.description()));
		}
		if (request.active() != null) {
			pole.setActive(request.active());
		}
		return toPole(pole);
	}

	@Transactional(readOnly = true)
	public List<PoleResponse> polesForUser(UUID userId) {
		requireBureauOrSelf(userId);
		return userPoleRepository.findByUserId(userId).stream()
				.map(up -> poleRepository.findById(up.getPoleId()).orElse(null))
				.filter(p -> p != null)
				.map(this::toPole)
				.toList();
	}

	@Transactional
	public List<PoleResponse> assignPole(UUID userId, AssignPoleRequest request) {
		UserPrincipal current = requireBureau();
		userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
		Pole pole = poleRepository.findById(request.poleId())
				.orElseThrow(() -> new ResourceNotFoundException("Pôle introuvable"));
		if (!pole.isActive()) {
			throw new BadRequestException("Pôle inactif");
		}
		if (!userPoleRepository.existsByUserIdAndPoleId(userId, pole.getId())) {
			userPoleRepository.save(new UserPole(userId, pole.getId()));
			auditService.record(
					current,
					"POLE_ASSIGN",
					"USER",
					userId,
					"Rattachement au pôle " + pole.getName(),
					"{\"poleId\":\"" + pole.getId() + "\"}");
		}
		return polesForUser(userId);
	}

	@Transactional
	public List<PoleResponse> unassignPole(UUID userId, UUID poleId) {
		UserPrincipal current = requireBureau();
		userPoleRepository.deleteByUserIdAndPoleId(userId, poleId);
		auditService.record(
				current,
				"POLE_UNASSIGN",
				"USER",
				userId,
				"Retrait du pôle " + poleId,
				"{\"poleId\":\"" + poleId + "\"}");
		return polesForUser(userId);
	}

	@Transactional
	public List<RecruitmentEntryResponse> listEntries(RecruitmentStage stage) {
		requireBureau();
		ensurePendingBackfill();
		List<RecruitmentEntry> entries = stage == null
				? entryRepository.findAllByOrderByUpdatedAtDesc()
				: entryRepository.findByStageOrderByUpdatedAtDesc(stage);
		return mapEntries(entries);
	}

	@Transactional
	public RecruitmentEntryResponse updateEntry(UUID id, UpdateRecruitmentEntryRequest request) {
		UserPrincipal current = requireBureau();
		RecruitmentEntry entry = entryRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Candidature introuvable"));
		User user = userRepository.findById(entry.getUserId())
				.orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

		if (Boolean.TRUE.equals(request.clearPole())) {
			entry.setPoleId(null);
		} else if (request.poleId() != null) {
			if (!poleRepository.existsById(request.poleId())) {
				throw new BadRequestException("Pôle introuvable");
			}
			entry.setPoleId(request.poleId());
		}
		if (request.notes() != null) {
			entry.setNotes(blankToNull(request.notes()));
		}
		if (request.interviewAt() != null) {
			entry.setInterviewAt(request.interviewAt());
		}
		if (request.stage() != null && request.stage() != entry.getStage()) {
			applyStage(entry, user, request.stage(), current);
		}
		return toEntry(entry, user);
	}

	/** Called when a pending registration is created. */
	@Transactional
	public void ensureEntryForPendingUser(UUID userId) {
		if (entryRepository.existsByUserId(userId)) {
			return;
		}
		entryRepository.save(new RecruitmentEntry(userId, RecruitmentStage.CANDIDATURE));
	}

	private void applyStage(RecruitmentEntry entry, User user, RecruitmentStage stage, UserPrincipal actor) {
		entry.setStage(stage);
		if (stage == RecruitmentStage.ACCEPTED) {
			user.setMembershipStatus(MembershipStatus.APPROVED);
			user.setActive(true);
			entry.setDecidedAt(Instant.now());
			if (entry.getPoleId() != null
					&& !userPoleRepository.existsByUserIdAndPoleId(user.getId(), entry.getPoleId())) {
				userPoleRepository.save(new UserPole(user.getId(), entry.getPoleId()));
			}
			auditService.record(
					actor,
					"MEMBERSHIP_APPROVE",
					"USER",
					user.getId(),
					"Adhésion acceptée via pipeline recrutement",
					"{\"via\":\"recruitment\"}");
		} else if (stage == RecruitmentStage.REJECTED) {
			user.setMembershipStatus(MembershipStatus.REJECTED);
			user.setActive(false);
			entry.setDecidedAt(Instant.now());
			auditService.record(
					actor,
					"MEMBERSHIP_REJECT",
					"USER",
					user.getId(),
					"Adhésion refusée via pipeline recrutement",
					"{\"via\":\"recruitment\"}");
		} else if (stage == RecruitmentStage.ENTRETIEN && entry.getInterviewAt() == null) {
			// leave interviewAt for bureau to set
		} else if (stage == RecruitmentStage.CANDIDATURE
				|| stage == RecruitmentStage.DECISION
				|| stage == RecruitmentStage.ENTRETIEN) {
			entry.setDecidedAt(null);
		}
	}

	private void ensurePendingBackfill() {
		List<User> pending = userRepository.findByMembershipStatusOrderByLastNameAscFirstNameAsc(
				MembershipStatus.PENDING,
				org.springframework.data.domain.Pageable.unpaged()).getContent();
		for (User user : pending) {
			if (!entryRepository.existsByUserId(user.getId())) {
				entryRepository.save(new RecruitmentEntry(user.getId(), RecruitmentStage.CANDIDATURE));
			}
		}
	}

	private List<RecruitmentEntryResponse> mapEntries(List<RecruitmentEntry> entries) {
		if (entries.isEmpty()) {
			return List.of();
		}
		Map<UUID, User> users = userRepository.findAllById(
				entries.stream().map(RecruitmentEntry::getUserId).toList()).stream()
				.collect(Collectors.toMap(User::getId, u -> u));
		Map<UUID, Pole> poles = poleRepository.findAllById(
				entries.stream().map(RecruitmentEntry::getPoleId).filter(id -> id != null).distinct().toList())
				.stream()
				.collect(Collectors.toMap(Pole::getId, p -> p));
		List<RecruitmentEntryResponse> out = new ArrayList<>();
		for (RecruitmentEntry entry : entries) {
			User user = users.get(entry.getUserId());
			if (user == null) {
				continue;
			}
			Pole pole = entry.getPoleId() != null ? poles.get(entry.getPoleId()) : null;
			out.add(new RecruitmentEntryResponse(
					entry.getId(),
					user.getId(),
					user.getEmail(),
					user.getFirstName(),
					user.getLastName(),
					user.getMembershipStatus(),
					entry.getPoleId(),
					pole != null ? pole.getName() : null,
					entry.getStage(),
					entry.getNotes(),
					entry.getInterviewAt(),
					entry.getDecidedAt(),
					entry.getCreatedAt(),
					entry.getUpdatedAt()));
		}
		return out;
	}

	private RecruitmentEntryResponse toEntry(RecruitmentEntry entry, User user) {
		String poleName = null;
		if (entry.getPoleId() != null) {
			poleName = poleRepository.findById(entry.getPoleId()).map(Pole::getName).orElse(null);
		}
		return new RecruitmentEntryResponse(
				entry.getId(),
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getMembershipStatus(),
				entry.getPoleId(),
				poleName,
				entry.getStage(),
				entry.getNotes(),
				entry.getInterviewAt(),
				entry.getDecidedAt(),
				entry.getCreatedAt(),
				entry.getUpdatedAt());
	}

	private PoleResponse toPole(Pole pole) {
		return new PoleResponse(
				pole.getId(),
				pole.getName(),
				pole.getDescription(),
				pole.isActive(),
				pole.getCreatedAt(),
				pole.getUpdatedAt());
	}

	private UserPrincipal requireBureau() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.BUREAU && current.getClubRole() != ClubRole.ADMIN_TECH) {
			throw new AccessDeniedException("Réservé au bureau");
		}
		return current;
	}

	private void requireBureauOrSelf(UUID userId) {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getId().equals(userId)) {
			return;
		}
		requireBureau();
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
