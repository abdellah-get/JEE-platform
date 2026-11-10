package ma.ensem.jee.platform.recruitment;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_poles")
@IdClass(UserPoleId.class)
public class UserPole {

	@Id
	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Id
	@Column(name = "pole_id", nullable = false)
	private UUID poleId;

	@Column(name = "assigned_at", nullable = false)
	private Instant assignedAt;

	protected UserPole() {
	}

	public UserPole(UUID userId, UUID poleId) {
		this.userId = userId;
		this.poleId = poleId;
	}

	@PrePersist
	void onCreate() {
		if (this.assignedAt == null) {
			this.assignedAt = Instant.now();
		}
	}

	public UUID getUserId() {
		return userId;
	}

	public UUID getPoleId() {
		return poleId;
	}

	public Instant getAssignedAt() {
		return assignedAt;
	}
}
