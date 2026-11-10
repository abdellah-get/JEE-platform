package ma.ensem.jee.platform.finance;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_budgets")
public class ProjectBudget {

	@Id
	@Column(name = "project_id")
	private UUID projectId;

	@Column(name = "amount_cents", nullable = false)
	private long amountCents;

	@Column(nullable = false, length = 8)
	private String currency;

	@Column(name = "updated_by")
	private UUID updatedBy;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ProjectBudget() {
	}

	public ProjectBudget(UUID projectId, long amountCents, String currency, UUID updatedBy) {
		this.projectId = projectId;
		this.amountCents = amountCents;
		this.currency = currency;
		this.updatedBy = updatedBy;
	}

	@PrePersist
	@PreUpdate
	void touch() {
		this.updatedAt = Instant.now();
	}

	public UUID getProjectId() {
		return projectId;
	}

	public long getAmountCents() {
		return amountCents;
	}

	public void setAmountCents(long amountCents) {
		this.amountCents = amountCents;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public UUID getUpdatedBy() {
		return updatedBy;
	}

	public void setUpdatedBy(UUID updatedBy) {
		this.updatedBy = updatedBy;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
