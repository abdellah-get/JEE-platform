package ma.ensem.jee.platform.event;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRsvpRepository extends JpaRepository<EventRsvp, UUID> {

	Optional<EventRsvp> findByEventIdAndUserId(UUID eventId, UUID userId);

	List<EventRsvp> findByEventIdOrderByUpdatedAtDesc(UUID eventId);

	List<EventRsvp> findByEventIdInAndUserId(Collection<UUID> eventIds, UUID userId);

	long countByEventIdAndStatus(UUID eventId, EventRsvpStatus status);

	void deleteByEventIdAndUserId(UUID eventId, UUID userId);
}
