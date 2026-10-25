package ma.ensem.jee.platform.project;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectActivityRepository extends JpaRepository<ProjectActivity, UUID> {

	List<ProjectActivity> findTop50ByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
