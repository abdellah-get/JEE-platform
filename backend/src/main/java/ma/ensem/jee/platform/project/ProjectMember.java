package ma.ensem.jee.platform.project;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_members")
@IdClass(ProjectMemberId.class)
public class ProjectMember {

	@Id
	@Column(name = "project_id", nullable = false)
	private UUID projectId;

	@Id
	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Enumerated(EnumType.STRING)
	@Column(name = "project_role", nullable = false, length = 32)
	private ProjectRole projectRole;

	@Column(name = "joined_at", nullable = false)
	private Instant joinedAt;

	protected ProjectMember() {
		// JPA
	}

	public ProjectMember(UUID projectId, UUID userId, ProjectRole projectRole) {
		this.projectId = projectId;
		this.userId = userId;
		this.projectRole = projectRole;
	}

	@PrePersist
	void onCreate() {
		if (this.joinedAt == null) {
			this.joinedAt = Instant.now();
		}
	}

	public UUID getProjectId() {
		return projectId;
	}

	public UUID getUserId() {
		return userId;
	}

	public ProjectRole getProjectRole() {
		return projectRole;
	}

	public void setProjectRole(ProjectRole projectRole) {
		this.projectRole = projectRole;
	}

	public Instant getJoinedAt() {
		return joinedAt;
	}
}
