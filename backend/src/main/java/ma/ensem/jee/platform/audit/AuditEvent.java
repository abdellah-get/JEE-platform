package ma.ensem.jee.platform.audit;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "audit_events")
public class AuditEvent {

	@Id
	private UUID id;

	@Column(name = "actor_id")
	private UUID actorId;

	@Column(name = "actor_email", nullable = false, length = 255)
	private String actorEmail;

	@Column(nullable = false, length = 64)
	private String action;

	@Column(name = "target_type", nullable = false, length = 64)
	private String targetType;

	@Column(name = "target_id", length = 64)
	private String targetId;

	@Column(nullable = false, length = 500)
	private String summary;

	@Column(name = "metadata_json", length = 2000)
	private String metadataJson;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected AuditEvent() {
		// JPA
	}

	public AuditEvent(
			UUID actorId,
			String actorEmail,
			String action,
			String targetType,
			String targetId,
			String summary,
			String metadataJson) {
		this.id = UUID.randomUUID();
		this.actorId = actorId;
		this.actorEmail = actorEmail;
		this.action = action;
		this.targetType = targetType;
		this.targetId = targetId;
		this.summary = summary;
		this.metadataJson = metadataJson;
	}

	@PrePersist
	void onCreate() {
		if (this.id == null) {
			this.id = UUID.randomUUID();
		}
		if (this.createdAt == null) {
			this.createdAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public UUID getActorId() {
		return actorId;
	}

	public String getActorEmail() {
		return actorEmail;
	}

	public String getAction() {
		return action;
	}

	public String getTargetType() {
		return targetType;
	}

	public String getTargetId() {
		return targetId;
	}

	public String getSummary() {
		return summary;
	}

	public String getMetadataJson() {
		return metadataJson;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
