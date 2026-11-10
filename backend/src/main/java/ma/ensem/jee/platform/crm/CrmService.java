package ma.ensem.jee.platform.crm;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.BadRequestException;
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.crm.dto.ContractResponse;
import ma.ensem.jee.platform.crm.dto.CreateContractRequest;
import ma.ensem.jee.platform.crm.dto.CreateLeadRequest;
import ma.ensem.jee.platform.crm.dto.CreateMissionRequest;
import ma.ensem.jee.platform.crm.dto.CreateQuoteRequest;
import ma.ensem.jee.platform.crm.dto.LeadResponse;
import ma.ensem.jee.platform.crm.dto.MissionResponse;
import ma.ensem.jee.platform.crm.dto.QuoteResponse;
import ma.ensem.jee.platform.crm.dto.UpdateContractRequest;
import ma.ensem.jee.platform.crm.dto.UpdateLeadRequest;
import ma.ensem.jee.platform.crm.dto.UpdateMissionRequest;
import ma.ensem.jee.platform.crm.dto.UpdateQuoteRequest;
import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectAccessService;
import ma.ensem.jee.platform.project.ProjectMember;
import ma.ensem.jee.platform.project.ProjectMemberRepository;
import ma.ensem.jee.platform.project.ProjectRepository;
import ma.ensem.jee.platform.project.ProjectRole;
import ma.ensem.jee.platform.user.ClubRole;

@Service
public class CrmService {

	private final CrmLeadRepository leadRepository;
	private final CrmMissionRepository missionRepository;
	private final CrmQuoteRepository quoteRepository;
	private final CrmContractRepository contractRepository;
	private final ProjectRepository projectRepository;
	private final ProjectMemberRepository projectMemberRepository;
	private final ProjectAccessService projectAccessService;

	public CrmService(
			CrmLeadRepository leadRepository,
			CrmMissionRepository missionRepository,
			CrmQuoteRepository quoteRepository,
			CrmContractRepository contractRepository,
			ProjectRepository projectRepository,
			ProjectMemberRepository projectMemberRepository,
			ProjectAccessService projectAccessService) {
		this.leadRepository = leadRepository;
		this.missionRepository = missionRepository;
		this.quoteRepository = quoteRepository;
		this.contractRepository = contractRepository;
		this.projectRepository = projectRepository;
		this.projectMemberRepository = projectMemberRepository;
		this.projectAccessService = projectAccessService;
	}

	@Transactional(readOnly = true)
	public PageResponse<LeadResponse> listLeads(LeadStatus status, int page, int size) {
		requireBureau();
		Page<CrmLead> leads = status == null
				? leadRepository.findAllByOrderByUpdatedAtDesc(PageResponse.toPageable(page, size))
				: leadRepository.findByStatusOrderByUpdatedAtDesc(status, PageResponse.toPageable(page, size));
		return PageResponse.from(leads.map(this::toLead));
	}

	@Transactional
	public LeadResponse createLead(CreateLeadRequest request) {
		UserPrincipal current = requireBureau();
		CrmLead lead = new CrmLead(
				request.companyName().trim(),
				blankToNull(request.contactName()),
				blankToNull(request.contactEmail()),
				request.status() != null ? request.status() : LeadStatus.NEW,
				blankToNull(request.notes()),
				current.getId());
		leadRepository.save(lead);
		return toLead(lead);
	}

	@Transactional
	public LeadResponse updateLead(UUID id, UpdateLeadRequest request) {
		requireBureau();
		CrmLead lead = leadRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Lead introuvable"));
		if (request.companyName() != null && !request.companyName().isBlank()) {
			lead.setCompanyName(request.companyName().trim());
		}
		if (request.contactName() != null) {
			lead.setContactName(blankToNull(request.contactName()));
		}
		if (request.contactEmail() != null) {
			lead.setContactEmail(blankToNull(request.contactEmail()));
		}
		if (request.status() != null) {
			lead.setStatus(request.status());
		}
		if (request.notes() != null) {
			lead.setNotes(blankToNull(request.notes()));
		}
		return toLead(lead);
	}

	@Transactional(readOnly = true)
	public PageResponse<MissionResponse> listMissions(MissionStatus status, int page, int size) {
		UserPrincipal current = SecurityUtils.currentUser();
		Pageable pageable = PageResponse.toPageable(page, size);
		Page<CrmMission> missions;
		if (isBureau(current)) {
			missions = status == null
					? missionRepository.findAllByOrderByUpdatedAtDesc(pageable)
					: missionRepository.findByStatusOrderByUpdatedAtDesc(status, pageable);
		} else {
			Set<UUID> chefProjects = chefProjectIds(current.getId());
			if (chefProjects.isEmpty()) {
				throw new AccessDeniedException("Accès CRM réservé au bureau ou chef de projet");
			}
			missions = status == null
					? missionRepository.findVisibleToChef(current.getId(), chefProjects, pageable)
					: missionRepository.findVisibleToChefAndStatus(current.getId(), chefProjects, status, pageable);
		}
		return PageResponse.from(missions.map(m -> toMission(m, false)));
	}

	@Transactional(readOnly = true)
	public MissionResponse getMission(UUID id) {
		CrmMission mission = requireVisibleMission(id);
		return toMission(mission, true);
	}

	@Transactional
	public MissionResponse createMission(CreateMissionRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		UUID projectId = request.projectId();
		boolean chef = !chefProjectIds(current.getId()).isEmpty();
		if (isBureau(current)) {
			// ok
		} else if (chef && (projectId == null || isChefOf(current.getId(), projectId))) {
			// ok — chef peut créer ; projet lié seulement s'il en est chef
		} else {
			throw new AccessDeniedException("Création mission réservée au bureau ou chef de projet");
		}
		if (request.leadId() != null && !leadRepository.existsById(request.leadId())) {
			throw new BadRequestException("Lead introuvable");
		}
		if (projectId != null) {
			projectAccessService.requireVisibleProject(projectId, current);
		}
		CrmMission mission = new CrmMission(
				request.leadId(),
				projectId,
				request.title().trim(),
				blankToNull(request.description()),
				request.status() != null ? request.status() : MissionStatus.LEAD,
				current.getId());
		missionRepository.save(mission);
		return toMission(mission, true);
	}

	@Transactional
	public MissionResponse updateMission(UUID id, UpdateMissionRequest request) {
		CrmMission mission = requireEditableMission(id);
		UserPrincipal current = SecurityUtils.currentUser();

		if (Boolean.TRUE.equals(request.clearLead())) {
			mission.setLeadId(null);
		} else if (request.leadId() != null) {
			if (!isBureau(current)) {
				throw new AccessDeniedException("Seul le bureau peut lier un lead");
			}
			if (!leadRepository.existsById(request.leadId())) {
				throw new BadRequestException("Lead introuvable");
			}
			mission.setLeadId(request.leadId());
		}

		if (Boolean.TRUE.equals(request.clearProject())) {
			if (!isBureau(current)) {
				throw new AccessDeniedException("Seul le bureau peut retirer le projet");
			}
			mission.setProjectId(null);
		} else if (request.projectId() != null) {
			if (!isBureau(current) && !isChefOf(current.getId(), request.projectId())) {
				throw new AccessDeniedException("Projet non autorisé");
			}
			projectAccessService.requireVisibleProject(request.projectId(), current);
			mission.setProjectId(request.projectId());
		}

		if (request.title() != null && !request.title().isBlank()) {
			mission.setTitle(request.title().trim());
		}
		if (request.description() != null) {
			mission.setDescription(blankToNull(request.description()));
		}
		if (request.status() != null) {
			mission.setStatus(request.status());
		}
		return toMission(mission, true);
	}

	@Transactional
	public QuoteResponse createQuote(UUID missionId, CreateQuoteRequest request) {
		requireEditableMission(missionId);
		CrmQuote quote = new CrmQuote(
				missionId,
				request.amountCents(),
				currencyOrDefault(request.currency()),
				request.status() != null ? request.status() : QuoteStatus.DRAFT,
				request.validUntil(),
				blankToNull(request.notes()));
		quoteRepository.save(quote);
		CrmMission mission = missionRepository.findById(missionId).orElseThrow();
		if (mission.getStatus() == MissionStatus.LEAD) {
			mission.setStatus(MissionStatus.QUOTE);
		}
		return toQuote(quote);
	}

	@Transactional
	public QuoteResponse updateQuote(UUID quoteId, UpdateQuoteRequest request) {
		CrmQuote quote = quoteRepository.findById(quoteId)
				.orElseThrow(() -> new ResourceNotFoundException("Devis introuvable"));
		requireEditableMission(quote.getMissionId());
		if (request.amountCents() != null) {
			quote.setAmountCents(request.amountCents());
		}
		if (request.currency() != null && !request.currency().isBlank()) {
			quote.setCurrency(request.currency().trim().toUpperCase());
		}
		if (request.status() != null) {
			quote.setStatus(request.status());
		}
		if (request.validUntil() != null) {
			quote.setValidUntil(request.validUntil());
		}
		if (request.notes() != null) {
			quote.setNotes(blankToNull(request.notes()));
		}
		return toQuote(quote);
	}

	@Transactional
	public ContractResponse createContract(UUID missionId, CreateContractRequest request) {
		requireEditableMission(missionId);
		CrmContract contract = new CrmContract(
				missionId,
				request.amountCents(),
				currencyOrDefault(request.currency()),
				request.status() != null ? request.status() : ContractStatus.DRAFT,
				request.signedAt(),
				blankToNull(request.notes()));
		contractRepository.save(contract);
		CrmMission mission = missionRepository.findById(missionId).orElseThrow();
		if (mission.getStatus() == MissionStatus.LEAD || mission.getStatus() == MissionStatus.QUOTE) {
			mission.setStatus(MissionStatus.CONTRACT);
		}
		return toContract(contract);
	}

	@Transactional
	public ContractResponse updateContract(UUID contractId, UpdateContractRequest request) {
		CrmContract contract = contractRepository.findById(contractId)
				.orElseThrow(() -> new ResourceNotFoundException("Contrat introuvable"));
		requireEditableMission(contract.getMissionId());
		if (request.amountCents() != null) {
			contract.setAmountCents(request.amountCents());
		}
		if (request.currency() != null && !request.currency().isBlank()) {
			contract.setCurrency(request.currency().trim().toUpperCase());
		}
		if (request.status() != null) {
			contract.setStatus(request.status());
			if (request.status() == ContractStatus.SIGNED && contract.getSignedAt() == null) {
				contract.setSignedAt(request.signedAt() != null ? request.signedAt() : java.time.Instant.now());
			}
		}
		if (request.signedAt() != null) {
			contract.setSignedAt(request.signedAt());
		}
		if (request.notes() != null) {
			contract.setNotes(blankToNull(request.notes()));
		}
		return toContract(contract);
	}

	private CrmMission requireVisibleMission(UUID id) {
		CrmMission mission = missionRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Mission introuvable"));
		UserPrincipal current = SecurityUtils.currentUser();
		if (isBureau(current)) {
			return mission;
		}
		if (current.getId().equals(mission.getOwnerId())) {
			return mission;
		}
		if (mission.getProjectId() != null && isChefOf(current.getId(), mission.getProjectId())) {
			return mission;
		}
		throw new ResourceNotFoundException("Mission introuvable");
	}

	private CrmMission requireEditableMission(UUID id) {
		return requireVisibleMission(id);
	}

	private UserPrincipal requireBureau() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (!isBureau(current)) {
			throw new AccessDeniedException("Réservé au bureau");
		}
		return current;
	}

	private boolean isBureau(UserPrincipal user) {
		return user.getClubRole() == ClubRole.BUREAU || user.getClubRole() == ClubRole.ADMIN_TECH;
	}

	private boolean isChefOf(UUID userId, UUID projectId) {
		return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
				.map(m -> m.getProjectRole() == ProjectRole.CHEF_PROJET)
				.orElse(false);
	}

	private Set<UUID> chefProjectIds(UUID userId) {
		return projectMemberRepository.findByUserIdAndProjectRole(userId, ProjectRole.CHEF_PROJET).stream()
				.map(ProjectMember::getProjectId)
				.collect(Collectors.toSet());
	}

	private MissionResponse toMission(CrmMission mission, boolean includeChildren) {
		String leadName = null;
		if (mission.getLeadId() != null) {
			leadName = leadRepository.findById(mission.getLeadId()).map(CrmLead::getCompanyName).orElse(null);
		}
		String projectName = null;
		if (mission.getProjectId() != null) {
			projectName = projectRepository.findById(mission.getProjectId()).map(Project::getName).orElse(null);
		}
		List<QuoteResponse> quotes = includeChildren
				? quoteRepository.findByMissionIdOrderByCreatedAtDesc(mission.getId()).stream().map(this::toQuote).toList()
				: List.of();
		List<ContractResponse> contracts = includeChildren
				? contractRepository.findByMissionIdOrderByCreatedAtDesc(mission.getId()).stream().map(this::toContract).toList()
				: List.of();
		return new MissionResponse(
				mission.getId(),
				mission.getLeadId(),
				leadName,
				mission.getProjectId(),
				projectName,
				mission.getTitle(),
				mission.getDescription(),
				mission.getStatus(),
				mission.getOwnerId(),
				quotes,
				contracts,
				mission.getCreatedAt(),
				mission.getUpdatedAt());
	}

	private LeadResponse toLead(CrmLead lead) {
		return new LeadResponse(
				lead.getId(),
				lead.getCompanyName(),
				lead.getContactName(),
				lead.getContactEmail(),
				lead.getStatus(),
				lead.getNotes(),
				lead.getOwnerId(),
				lead.getCreatedAt(),
				lead.getUpdatedAt());
	}

	private QuoteResponse toQuote(CrmQuote quote) {
		return new QuoteResponse(
				quote.getId(),
				quote.getMissionId(),
				quote.getAmountCents(),
				quote.getCurrency(),
				quote.getStatus(),
				quote.getValidUntil(),
				quote.getNotes(),
				quote.getCreatedAt(),
				quote.getUpdatedAt());
	}

	private ContractResponse toContract(CrmContract contract) {
		return new ContractResponse(
				contract.getId(),
				contract.getMissionId(),
				contract.getAmountCents(),
				contract.getCurrency(),
				contract.getStatus(),
				contract.getSignedAt(),
				contract.getNotes(),
				contract.getCreatedAt(),
				contract.getUpdatedAt());
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private static String currencyOrDefault(String currency) {
		if (currency == null || currency.isBlank()) {
			return "MAD";
		}
		return currency.trim().toUpperCase();
	}
}
