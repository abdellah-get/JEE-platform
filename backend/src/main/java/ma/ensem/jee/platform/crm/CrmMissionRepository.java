package ma.ensem.jee.platform.crm;

import java.util.Collection;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CrmMissionRepository extends JpaRepository<CrmMission, UUID> {

	Page<CrmMission> findAllByOrderByUpdatedAtDesc(Pageable pageable);

	Page<CrmMission> findByStatusOrderByUpdatedAtDesc(MissionStatus status, Pageable pageable);

	@Query("""
			select m from CrmMission m
			where m.ownerId = :ownerId
			   or m.projectId in :projectIds
			order by m.updatedAt desc
			""")
	Page<CrmMission> findVisibleToChef(
			@Param("ownerId") UUID ownerId,
			@Param("projectIds") Collection<UUID> projectIds,
			Pageable pageable);

	@Query("""
			select m from CrmMission m
			where (m.ownerId = :ownerId or m.projectId in :projectIds)
			  and m.status = :status
			order by m.updatedAt desc
			""")
	Page<CrmMission> findVisibleToChefAndStatus(
			@Param("ownerId") UUID ownerId,
			@Param("projectIds") Collection<UUID> projectIds,
			@Param("status") MissionStatus status,
			Pageable pageable);
}
