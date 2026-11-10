package ma.ensem.jee.platform.finance;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, UUID> {

	List<ExpenseClaim> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

	Page<ExpenseClaim> findByStatusOrderByCreatedAtDesc(ExpenseClaimStatus status, Pageable pageable);

	Page<ExpenseClaim> findAllByOrderByCreatedAtDesc(Pageable pageable);

	@Query("""
			select coalesce(sum(e.amountCents), 0) from ExpenseClaim e
			where e.projectId = :projectId
			  and e.status = ma.ensem.jee.platform.finance.ExpenseClaimStatus.APPROVED
			""")
	long sumApprovedByProjectId(@Param("projectId") UUID projectId);
}
