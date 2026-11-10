package ma.ensem.jee.platform.finance;

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
@Table(name = "expense_claims")
public class ExpenseClaim {

	@Id
	private UUID id;

	@Column(name = "project_id", nullable = false)
	private UUID projectId;

	@Column(name = "submitter_id", nullable = false)
	private UUID submitterId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private ExpenseCategory category;

	@Column(name = "amount_cents", nullable = false)
	private long amountCents;

	@Column(nullable = false, length = 500)
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private ExpenseClaimStatus status;

	@Column(name = "receipt_note", length = 500)
	private String receiptNote;

	@Column(name = "decided_by")
	private UUID decidedBy;

	@Column(name = "decided_at")
	private Instant decidedAt;

	@Column(name = "decision_note", length = 500)
	private String decisionNote;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ExpenseClaim() {
	}

	public ExpenseClaim(
			UUID projectId,
			UUID submitterId,
			ExpenseCategory category,
			long amountCents,
			String description,
			String receiptNote) {
		this.id = UUID.randomUUID();
		this.projectId = projectId;
		this.submitterId = submitterId;
		this.category = category;
		this.amountCents = amountCents;
		this.description = description;
		this.status = ExpenseClaimStatus.PENDING;
		this.receiptNote = receiptNote;
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

	public UUID getProjectId() {
		return projectId;
	}

	public UUID getSubmitterId() {
		return submitterId;
	}

	public ExpenseCategory getCategory() {
		return category;
	}

	public long getAmountCents() {
		return amountCents;
	}

	public String getDescription() {
		return description;
	}

	public ExpenseClaimStatus getStatus() {
		return status;
	}

	public void setStatus(ExpenseClaimStatus status) {
		this.status = status;
	}

	public String getReceiptNote() {
		return receiptNote;
	}

	public UUID getDecidedBy() {
		return decidedBy;
	}

	public void setDecidedBy(UUID decidedBy) {
		this.decidedBy = decidedBy;
	}

	public Instant getDecidedAt() {
		return decidedAt;
	}

	public void setDecidedAt(Instant decidedAt) {
		this.decidedAt = decidedAt;
	}

	public String getDecisionNote() {
		return decisionNote;
	}

	public void setDecisionNote(String decisionNote) {
		this.decisionNote = decisionNote;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
