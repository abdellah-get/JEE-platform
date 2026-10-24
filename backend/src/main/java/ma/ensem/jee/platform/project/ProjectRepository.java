package ma.ensem.jee.platform.project;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

	@Query("""
			select p from Project p
			where p.id in (
			  select m.projectId from ProjectMember m where m.userId = :userId
			)
			order by p.updatedAt desc
			""")
	List<Project> findAllVisibleToMember(@Param("userId") UUID userId);

	List<Project> findAllByOrderByUpdatedAtDesc();

	long countByStatus(ProjectStatus status);
}
