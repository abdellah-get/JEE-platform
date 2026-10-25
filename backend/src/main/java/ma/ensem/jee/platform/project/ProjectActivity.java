package ma.ensem.jee.platform.project;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_activities")
public class ProjectActivity {

	@Id
	private UUID id;

	@Column(name = "project_id", nullable = false)
	private UUID projectId;

	@Column(name = "actor_user_id", nullable = false)
	private UUID actorUserId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 64)
	private ProjectActivityType type;

	@Column(nullable = false, length = 500)
	private String message;

	@Column(name = "task_id")
	private UUID taskId;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected ProjectActivity() {
		// JPA
	}

	public ProjectActivity(
			UUID projectId,
			UUID actorUserId,
			ProjectActivityType type,
			String message,
			UUID taskId) {
		this.id = UUID.randomUUID();
		this.projectId = projectId;
		this.actorUserId = actorUserId;
		this.type = type;
		this.message = message;
		this.taskId = taskId;
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

	public UUID getProjectId() {
		return projectId;
	}

	public UUID getActorUserId() {
		return actorUserId;
	}

	public ProjectActivityType getType() {
		return type;
	}

	public String getMessage() {
		return message;
	}

	public UUID getTaskId() {
		return taskId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
