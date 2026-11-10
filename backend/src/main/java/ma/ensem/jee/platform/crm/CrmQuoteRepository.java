package ma.ensem.jee.platform.crm;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CrmQuoteRepository extends JpaRepository<CrmQuote, UUID> {

	List<CrmQuote> findByMissionIdOrderByCreatedAtDesc(UUID missionId);
}
