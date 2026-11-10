package ma.ensem.jee.platform.event;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "event_rsvps",
		uniqueConstraints = @UniqueConstraint(name = "uq_event_rsvps_event_user", columnNames = { "event_id", "user_id" }))
public class EventRsvp {

	@Id
	private UUID id;

	@Column(name = "event_id", nullable = false)
	private UUID eventId;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private EventRsvpStatus status;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected EventRsvp() {
		// JPA
	}

	public EventRsvp(UUID eventId, UUID userId, EventRsvpStatus status) {
		this.id = UUID.randomUUID();
		this.eventId = eventId;
		this.userId = userId;
		this.status = status;
	}

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		this.createdAt = now;
		this.updatedAt = now;
		if (this.id == null) {
			this.id = UUID.randomUUID();
		}
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public UUID getEventId() {
		return eventId;
	}

	public UUID getUserId() {
		return userId;
	}

	public EventRsvpStatus getStatus() {
		return status;
	}

	public void setStatus(EventRsvpStatus status) {
		this.status = status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
