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
@Table(name = "crm_leads")
public class CrmLead {

	@Id
	private UUID id;

	@Column(name = "company_name", nullable = false, length = 200)
	private String companyName;

	@Column(name = "contact_name", length = 200)
	private String contactName;

	@Column(name = "contact_email", length = 255)
	private String contactEmail;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private LeadStatus status;

	@Column(columnDefinition = "TEXT")
	private String notes;

	@Column(name = "owner_id")
	private UUID ownerId;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected CrmLead() {
	}

	public CrmLead(String companyName, String contactName, String contactEmail, LeadStatus status, String notes, UUID ownerId) {
		this.id = UUID.randomUUID();
		this.companyName = companyName;
		this.contactName = contactName;
		this.contactEmail = contactEmail;
		this.status = status;
		this.notes = notes;
		this.ownerId = ownerId;
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

	public String getCompanyName() {
		return companyName;
	}

	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}

	public String getContactName() {
		return contactName;
	}

	public void setContactName(String contactName) {
		this.contactName = contactName;
	}

	public String getContactEmail() {
		return contactEmail;
	}

	public void setContactEmail(String contactEmail) {
		this.contactEmail = contactEmail;
	}

	public LeadStatus getStatus() {
		return status;
	}

	public void setStatus(LeadStatus status) {
		this.status = status;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public UUID getOwnerId() {
		return ownerId;
	}

	public void setOwnerId(UUID ownerId) {
		this.ownerId = ownerId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
