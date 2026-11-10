package ma.ensem.jee.platform.finance;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.finance.dto.BudgetResponse;
import ma.ensem.jee.platform.finance.dto.CreateExpenseClaimRequest;
import ma.ensem.jee.platform.finance.dto.DecideExpenseRequest;
import ma.ensem.jee.platform.finance.dto.ExpenseClaimResponse;
import ma.ensem.jee.platform.finance.dto.FinanceSummaryResponse;
import ma.ensem.jee.platform.finance.dto.UpsertBudgetRequest;

@RestController
@RequestMapping("/api/v1/finance")
public class FinanceController {

	private final FinanceService financeService;

	public FinanceController(FinanceService financeService) {
		this.financeService = financeService;
	}

	@GetMapping("/summary")
	public FinanceSummaryResponse summary() {
		return financeService.summary();
	}

	@GetMapping(value = "/export.csv", produces = "text/csv;charset=UTF-8")
	public ResponseEntity<String> exportCsv() {
		String csv = financeService.exportCsv();
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"jee-finance-export.csv\"")
				.contentType(new MediaType("text", "csv"))
				.body(csv);
	}

	@GetMapping("/projects/{projectId}/budget")
	public BudgetResponse getBudget(@PathVariable UUID projectId) {
		return financeService.getBudget(projectId);
	}

	@PutMapping("/projects/{projectId}/budget")
	public BudgetResponse upsertBudget(
			@PathVariable UUID projectId,
			@Valid @RequestBody UpsertBudgetRequest request) {
		return financeService.upsertBudget(projectId, request);
	}

	@GetMapping("/projects/{projectId}/expenses")
	public List<ExpenseClaimResponse> listProjectExpenses(@PathVariable UUID projectId) {
		return financeService.listProjectExpenses(projectId);
	}

	@PostMapping("/projects/{projectId}/expenses")
	@ResponseStatus(HttpStatus.CREATED)
	public ExpenseClaimResponse createExpense(
			@PathVariable UUID projectId,
			@Valid @RequestBody CreateExpenseClaimRequest request) {
		return financeService.createExpense(projectId, request);
	}

	@GetMapping("/expenses")
	public PageResponse<ExpenseClaimResponse> listExpenses(
			@RequestParam(required = false) ExpenseClaimStatus status,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "" + PageResponse.DEFAULT_SIZE) int size) {
		return financeService.listClaims(status, page, size);
	}

	@PatchMapping("/expenses/{id}/decision")
	public ExpenseClaimResponse decide(
			@PathVariable UUID id,
			@Valid @RequestBody DecideExpenseRequest request) {
		return financeService.decide(id, request);
	}
}
