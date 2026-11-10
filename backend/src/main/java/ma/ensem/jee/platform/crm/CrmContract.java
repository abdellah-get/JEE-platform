package ma.ensem.jee.platform.crm;

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
@Table(name = "crm_contracts")
public class CrmContract {

	@Id
	private UUID id;

	@Column(name = "mission_id", nullable = false)
	private UUID missionId;

	@Column(name = "amount_cents", nullable = false)
	private long amountCents;

	@Column(nullable = false, length = 8)
	private String currency;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private ContractStatus status;

	@Column(name = "signed_at")
	private Instant signedAt;

	@Column(columnDefinition = "TEXT")
	private String notes;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected CrmContract() {
	}

	public CrmContract(UUID missionId, long amountCents, String currency, ContractStatus status, Instant signedAt, String notes) {
		this.id = UUID.randomUUID();
		this.missionId = missionId;
		this.amountCents = amountCents;
		this.currency = currency;
		this.status = status;
		this.signedAt = signedAt;
		this.notes = notes;
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

	public UUID getMissionId() {
		return missionId;
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

	public ContractStatus getStatus() {
		return status;
	}

	public void setStatus(ContractStatus status) {
		this.status = status;
	}

	public Instant getSignedAt() {
		return signedAt;
	}

	public void setSignedAt(Instant signedAt) {
		this.signedAt = signedAt;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
