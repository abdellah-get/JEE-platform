package ma.ensem.jee.platform.announcement;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

	List<Announcement> findAllByOrderByPinnedDescCreatedAtDesc();

	Page<Announcement> findAllByOrderByPinnedDescCreatedAtDesc(Pageable pageable);

	List<Announcement> findByPinnedTrueOrderByCreatedAtDesc();

	long countByPinnedTrue();
}
