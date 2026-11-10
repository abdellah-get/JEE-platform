package ma.ensem.jee.platform.auth.totp;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "totp_recovery_codes")
public class TotpRecoveryCode {

	@Id
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "code_hash", nullable = false, length = 64)
	private String codeHash;

	@Column(name = "used_at")
	private Instant usedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected TotpRecoveryCode() {
	}

	public TotpRecoveryCode(UUID userId, String codeHash) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.codeHash = codeHash;
	}

	@PrePersist
	void onCreate() {
		if (this.id == null) {
			this.id = UUID.randomUUID();
		}
		this.createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public UUID getUserId() {
		return userId;
	}

	public String getCodeHash() {
		return codeHash;
	}

	public Instant getUsedAt() {
		return usedAt;
	}

	public void markUsed() {
		this.usedAt = Instant.now();
	}

	public boolean isUsed() {
		return usedAt != null;
	}
}
