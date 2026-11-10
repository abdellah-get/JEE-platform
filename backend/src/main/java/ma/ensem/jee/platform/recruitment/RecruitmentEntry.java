package ma.ensem.jee.platform.recruitment;

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

@Entity
@Table(name = "recruitment_entries")
public class RecruitmentEntry {

	@Id
	private UUID id;

	@Column(name = "user_id", nullable = false, unique = true)
	private UUID userId;

	@Column(name = "pole_id")
	private UUID poleId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private RecruitmentStage stage;

	@Column(columnDefinition = "TEXT")
	private String notes;

	@Column(name = "interview_at")
	private Instant interviewAt;

	@Column(name = "decided_at")
	private Instant decidedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected RecruitmentEntry() {
	}

	public RecruitmentEntry(UUID userId, RecruitmentStage stage) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.stage = stage;
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

	public UUID getUserId() {
		return userId;
	}

	public UUID getPoleId() {
		return poleId;
	}

	public void setPoleId(UUID poleId) {
		this.poleId = poleId;
	}

	public RecruitmentStage getStage() {
		return stage;
	}

	public void setStage(RecruitmentStage stage) {
		this.stage = stage;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getInterviewAt() {
		return interviewAt;
	}

	public void setInterviewAt(Instant interviewAt) {
		this.interviewAt = interviewAt;
	}

	public Instant getDecidedAt() {
		return decidedAt;
	}

	public void setDecidedAt(Instant decidedAt) {
		this.decidedAt = decidedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
