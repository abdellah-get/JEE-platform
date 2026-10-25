package ma.ensem.jee.platform.attachment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectAttachmentRepository extends JpaRepository<ProjectAttachment, UUID> {

	List<ProjectAttachment> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

	Optional<ProjectAttachment> findByIdAndProjectId(UUID id, UUID projectId);
}
