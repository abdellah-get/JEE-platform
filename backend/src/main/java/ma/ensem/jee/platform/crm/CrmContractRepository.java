package ma.ensem.jee.platform.crm;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CrmContractRepository extends JpaRepository<CrmContract, UUID> {

	List<CrmContract> findByMissionIdOrderByCreatedAtDesc(UUID missionId);
}
