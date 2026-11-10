package ma.ensem.jee.platform.recruitment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruitmentEntryRepository extends JpaRepository<RecruitmentEntry, UUID> {

	Optional<RecruitmentEntry> findByUserId(UUID userId);

	List<RecruitmentEntry> findAllByOrderByUpdatedAtDesc();

	List<RecruitmentEntry> findByStageOrderByUpdatedAtDesc(RecruitmentStage stage);

	boolean existsByUserId(UUID userId);
}
