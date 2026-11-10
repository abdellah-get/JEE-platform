package ma.ensem.jee.platform.audit;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

	@Query("""
			select e from AuditEvent e
			where (:action is null or e.action = :action)
			  and (:actorId is null or e.actorId = :actorId)
			  and (:from is null or e.createdAt >= :from)
			  and (:to is null or e.createdAt <= :to)
			order by e.createdAt desc
			""")
	Page<AuditEvent> search(
			@Param("action") String action,
			@Param("actorId") UUID actorId,
			@Param("from") Instant from,
			@Param("to") Instant to,
			Pageable pageable);
}
