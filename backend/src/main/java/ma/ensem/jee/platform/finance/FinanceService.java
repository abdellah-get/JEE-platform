package ma.ensem.jee.platform.finance;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.BadRequestException;
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.finance.dto.BudgetResponse;
import ma.ensem.jee.platform.finance.dto.CreateExpenseClaimRequest;
import ma.ensem.jee.platform.finance.dto.DecideExpenseRequest;
import ma.ensem.jee.platform.finance.dto.ExpenseClaimResponse;
import ma.ensem.jee.platform.finance.dto.FinanceSummaryResponse;
import ma.ensem.jee.platform.finance.dto.UpsertBudgetRequest;
import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectAccessService;
import ma.ensem.jee.platform.project.ProjectRepository;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class FinanceService {

	private final ProjectBudgetRepository budgetRepository;
	private final ExpenseClaimRepository expenseRepository;
	private final ProjectRepository projectRepository;
	private final ProjectAccessService projectAccessService;
	private final UserRepository userRepository;

	public FinanceService(
			ProjectBudgetRepository budgetRepository,
			ExpenseClaimRepository expenseRepository,
			ProjectRepository projectRepository,
			ProjectAccessService projectAccessService,
			UserRepository userRepository) {
		this.budgetRepository = budgetRepository;
		this.expenseRepository = expenseRepository;
		this.projectRepository = projectRepository;
		this.projectAccessService = projectAccessService;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public BudgetResponse getBudget(UUID projectId) {
		UserPrincipal current = SecurityUtils.currentUser();
		Project project = projectAccessService.requireVisibleProject(projectId, current);
		return toBudget(project, budgetRepository.findById(projectId).orElse(null));
	}

	@Transactional
	public BudgetResponse upsertBudget(UUID projectId, UpsertBudgetRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		projectAccessService.requireCanEdit(projectId, current);
		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
		ProjectBudget budget = budgetRepository.findById(projectId).orElse(null);
		String currency = request.currency() == null || request.currency().isBlank()
				? "MAD"
				: request.currency().trim().toUpperCase();
		if (budget == null) {
			budget = new ProjectBudget(projectId, request.amountCents(), currency, current.getId());
		} else {
			budget.setAmountCents(request.amountCents());
			budget.setCurrency(currency);
			budget.setUpdatedBy(current.getId());
		}
		budgetRepository.save(budget);
		return toBudget(project, budget);
	}

	@Transactional(readOnly = true)
	public List<ExpenseClaimResponse> listProjectExpenses(UUID projectId) {
		UserPrincipal current = SecurityUtils.currentUser();
		projectAccessService.requireVisibleProject(projectId, current);
		return expenseRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
				.map(this::toExpense)
				.toList();
	}

	@Transactional
	public ExpenseClaimResponse createExpense(UUID projectId, CreateExpenseClaimRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		projectAccessService.requireVisibleProject(projectId, current);
		ExpenseClaim claim = new ExpenseClaim(
				projectId,
				current.getId(),
				request.category(),
				request.amountCents(),
				request.description().trim(),
				blankToNull(request.receiptNote()));
		expenseRepository.save(claim);
		return toExpense(claim);
	}

	@Transactional(readOnly = true)
	public PageResponse<ExpenseClaimResponse> listClaims(ExpenseClaimStatus status, int page, int size) {
		requireBureau();
		Page<ExpenseClaim> claims = status == null
				? expenseRepository.findAllByOrderByCreatedAtDesc(PageResponse.toPageable(page, size))
				: expenseRepository.findByStatusOrderByCreatedAtDesc(status, PageResponse.toPageable(page, size));
		return PageResponse.from(claims.map(this::toExpense));
	}

	@Transactional
	public ExpenseClaimResponse decide(UUID claimId, DecideExpenseRequest request) {
		UserPrincipal current = requireBureau();
		if (request.status() != ExpenseClaimStatus.APPROVED && request.status() != ExpenseClaimStatus.REJECTED) {
			throw new BadRequestException("Décision invalide");
		}
		ExpenseClaim claim = expenseRepository.findById(claimId)
				.orElseThrow(() -> new ResourceNotFoundException("Note de frais introuvable"));
		if (claim.getStatus() != ExpenseClaimStatus.PENDING) {
			throw new BadRequestException("Cette note a déjà été traitée");
		}
		claim.setStatus(request.status());
		claim.setDecidedBy(current.getId());
		claim.setDecidedAt(Instant.now());
		claim.setDecisionNote(blankToNull(request.decisionNote()));
		return toExpense(claim);
	}

	@Transactional(readOnly = true)
	public FinanceSummaryResponse summary() {
		requireBureau();
		List<ProjectBudget> budgets = budgetRepository.findAll();
		Map<UUID, Project> projects = projectRepository.findAllById(
				budgets.stream().map(ProjectBudget::getProjectId).toList()).stream()
				.collect(Collectors.toMap(Project::getId, p -> p));

		List<BudgetResponse> rows = new ArrayList<>();
		long totalBudget = 0;
		long totalApproved = 0;
		for (ProjectBudget budget : budgets) {
			Project project = projects.get(budget.getProjectId());
			if (project == null) {
				continue;
			}
			BudgetResponse row = toBudget(project, budget);
			rows.add(row);
			totalBudget += row.amountCents();
			totalApproved += row.approvedExpensesCents();
		}
		long pending = expenseRepository.findByStatusOrderByCreatedAtDesc(
				ExpenseClaimStatus.PENDING, PageResponse.toPageable(0, 1)).getTotalElements();
		return new FinanceSummaryResponse(rows, totalBudget, totalApproved, pending);
	}

	@Transactional(readOnly = true)
	public String exportCsv() {
		requireBureau();
		StringBuilder csv = new StringBuilder();
		csv.append("project_id,project_name,budget_cents,currency,approved_expenses_cents,remaining_cents\n");
		for (BudgetResponse row : summary().budgets()) {
			csv.append(row.projectId())
					.append(',')
					.append(csvEscape(row.projectName()))
					.append(',')
					.append(row.amountCents())
					.append(',')
					.append(row.currency())
					.append(',')
					.append(row.approvedExpensesCents())
					.append(',')
					.append(row.remainingCents())
					.append('\n');
		}
		return csv.toString();
	}

	private BudgetResponse toBudget(Project project, ProjectBudget budget) {
		long approved = expenseRepository.sumApprovedByProjectId(project.getId());
		long amount = budget != null ? budget.getAmountCents() : 0;
		String currency = budget != null ? budget.getCurrency() : "MAD";
		return new BudgetResponse(
				project.getId(),
				project.getName(),
				amount,
				currency,
				approved,
				amount - approved,
				budget != null ? budget.getUpdatedBy() : null,
				budget != null ? budget.getUpdatedAt() : null);
	}

	private ExpenseClaimResponse toExpense(ExpenseClaim claim) {
		String projectName = projectRepository.findById(claim.getProjectId()).map(Project::getName).orElse("?");
		String submitterName = userRepository.findById(claim.getSubmitterId())
				.map(u -> u.getFirstName() + " " + u.getLastName())
				.orElse("?");
		return new ExpenseClaimResponse(
				claim.getId(),
				claim.getProjectId(),
				projectName,
				claim.getSubmitterId(),
				submitterName,
				claim.getCategory(),
				claim.getAmountCents(),
				claim.getDescription(),
				claim.getStatus(),
				claim.getReceiptNote(),
				claim.getDecidedBy(),
				claim.getDecidedAt(),
				claim.getDecisionNote(),
				claim.getCreatedAt(),
				claim.getUpdatedAt());
	}

	private UserPrincipal requireBureau() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.BUREAU && current.getClubRole() != ClubRole.ADMIN_TECH) {
			throw new AccessDeniedException("Réservé au bureau");
		}
		return current;
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}

	private static String csvEscape(String value) {
		if (value == null) {
			return "";
		}
		String escaped = value.replace("\"", "\"\"");
		if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
			return "\"" + escaped + "\"";
		}
		return escaped;
	}
}
