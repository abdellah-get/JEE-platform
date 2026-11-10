package ma.ensem.jee.platform.crm;

import java.time.Instant;
import java.time.LocalDate;
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
@Table(name = "crm_quotes")
public class CrmQuote {

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
	private QuoteStatus status;

	@Column(name = "valid_until")
	private LocalDate validUntil;

	@Column(columnDefinition = "TEXT")
	private String notes;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected CrmQuote() {
	}

	public CrmQuote(UUID missionId, long amountCents, String currency, QuoteStatus status, LocalDate validUntil, String notes) {
		this.id = UUID.randomUUID();
		this.missionId = missionId;
		this.amountCents = amountCents;
		this.currency = currency;
		this.status = status;
		this.validUntil = validUntil;
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

	public QuoteStatus getStatus() {
		return status;
	}

	public void setStatus(QuoteStatus status) {
		this.status = status;
	}

	public LocalDate getValidUntil() {
		return validUntil;
	}

	public void setValidUntil(LocalDate validUntil) {
		this.validUntil = validUntil;
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
