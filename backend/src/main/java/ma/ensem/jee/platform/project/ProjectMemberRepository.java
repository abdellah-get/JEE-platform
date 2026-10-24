package ma.ensem.jee.platform.project;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

	List<ProjectMember> findByProjectIdOrderByJoinedAtAsc(UUID projectId);

	Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

	boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);

	long countByProjectIdAndProjectRole(UUID projectId, ProjectRole projectRole);

	void deleteByProjectIdAndUserId(UUID projectId, UUID userId);

	void deleteByProjectId(UUID projectId);
}
