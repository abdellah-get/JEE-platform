package ma.ensem.jee.platform.finance.dto;

import java.util.List;

public record FinanceSummaryResponse(
		List<BudgetResponse> budgets,
		long totalBudgetCents,
		long totalApprovedExpensesCents,
		long pendingClaimsCount) {
}
