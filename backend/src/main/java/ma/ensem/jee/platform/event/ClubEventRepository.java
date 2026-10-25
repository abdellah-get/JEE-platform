package ma.ensem.jee.platform.event;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClubEventRepository extends JpaRepository<ClubEvent, UUID> {

	List<ClubEvent> findAllByOrderByPinnedDescStartsAtAsc();

	@Query("""
			select e from ClubEvent e
			where e.startsAt < :to
			  and (e.endsAt is null or e.endsAt >= :from)
			order by e.startsAt asc
			""")
	List<ClubEvent> findOverlapping(@Param("from") Instant from, @Param("to") Instant to);
}
