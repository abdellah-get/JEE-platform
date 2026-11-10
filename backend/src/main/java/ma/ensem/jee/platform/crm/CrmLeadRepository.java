package ma.ensem.jee.platform.crm;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrmLeadRepository extends JpaRepository<CrmLead, UUID> {

	Page<CrmLead> findAllByOrderByUpdatedAtDesc(Pageable pageable);

	Page<CrmLead> findByStatusOrderByUpdatedAtDesc(LeadStatus status, Pageable pageable);
}
