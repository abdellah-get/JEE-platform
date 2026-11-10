package ma.ensem.jee.platform.finance;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectBudgetRepository extends JpaRepository<ProjectBudget, UUID> {
}
