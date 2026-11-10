package ma.ensem.jee.platform.user;

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
@Table(name = "users")
public class User {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@Column(name = "first_name", nullable = false, length = 100)
	private String firstName;

	@Column(name = "last_name", nullable = false, length = 100)
	private String lastName;

	@Enumerated(EnumType.STRING)
	@Column(name = "club_role", nullable = false, length = 32)
	private ClubRole clubRole;

	@Column(nullable = false)
	private boolean active = true;

	@Enumerated(EnumType.STRING)
	@Column(name = "membership_status", nullable = false, length = 16)
	private MembershipStatus membershipStatus = MembershipStatus.APPROVED;

	@Column(name = "email_digest_enabled", nullable = false)
	private boolean emailDigestEnabled = false;

	@Enumerated(EnumType.STRING)
	@Column(name = "digest_frequency", nullable = false, length = 16)
	private DigestFrequency digestFrequency = DigestFrequency.WEEKLY;

	@Column(name = "notify_task_assigned", nullable = false)
	private boolean notifyTaskAssigned = true;

	@Column(name = "notify_announcement_pinned", nullable = false)
	private boolean notifyAnnouncementPinned = true;

	@Column(name = "notify_event_pinned", nullable = false)
	private boolean notifyEventPinned = true;

	@Column(name = "last_digest_sent_at")
	private Instant lastDigestSentAt;

	@Column(name = "totp_secret", length = 64)
	private String totpSecret;

	@Column(name = "totp_enabled", nullable = false)
	private boolean totpEnabled = false;

	@Column(name = "totp_confirmed_at")
	private Instant totpConfirmedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected User() {
		// JPA
	}

	public User(String email, String passwordHash, String firstName, String lastName, ClubRole clubRole) {
		this.id = UUID.randomUUID();
		this.email = email;
		this.passwordHash = passwordHash;
		this.firstName = firstName;
		this.lastName = lastName;
		this.clubRole = clubRole;
		this.active = true;
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

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public ClubRole getClubRole() {
		return clubRole;
	}

	public void setClubRole(ClubRole clubRole) {
		this.clubRole = clubRole;
	}

	public boolean isActive() {
		return active;
	}

	public void setActive(boolean active) {
		this.active = active;
	}

	public MembershipStatus getMembershipStatus() {
		return membershipStatus;
	}

	public void setMembershipStatus(MembershipStatus membershipStatus) {
		this.membershipStatus = membershipStatus;
	}

	public boolean isEmailDigestEnabled() {
		return emailDigestEnabled;
	}

	public void setEmailDigestEnabled(boolean emailDigestEnabled) {
		this.emailDigestEnabled = emailDigestEnabled;
	}

	public DigestFrequency getDigestFrequency() {
		return digestFrequency;
	}

	public void setDigestFrequency(DigestFrequency digestFrequency) {
		this.digestFrequency = digestFrequency;
	}

	public boolean isNotifyTaskAssigned() {
		return notifyTaskAssigned;
	}

	public void setNotifyTaskAssigned(boolean notifyTaskAssigned) {
		this.notifyTaskAssigned = notifyTaskAssigned;
	}

	public boolean isNotifyAnnouncementPinned() {
		return notifyAnnouncementPinned;
	}

	public void setNotifyAnnouncementPinned(boolean notifyAnnouncementPinned) {
		this.notifyAnnouncementPinned = notifyAnnouncementPinned;
	}

	public boolean isNotifyEventPinned() {
		return notifyEventPinned;
	}

	public void setNotifyEventPinned(boolean notifyEventPinned) {
		this.notifyEventPinned = notifyEventPinned;
	}

	public Instant getLastDigestSentAt() {
		return lastDigestSentAt;
	}

	public void setLastDigestSentAt(Instant lastDigestSentAt) {
		this.lastDigestSentAt = lastDigestSentAt;
	}

	public String getTotpSecret() {
		return totpSecret;
	}

	public void setTotpSecret(String totpSecret) {
		this.totpSecret = totpSecret;
	}

	public boolean isTotpEnabled() {
		return totpEnabled;
	}

	public void setTotpEnabled(boolean totpEnabled) {
		this.totpEnabled = totpEnabled;
	}

	public Instant getTotpConfirmedAt() {
		return totpConfirmedAt;
	}

	public void setTotpConfirmedAt(Instant totpConfirmedAt) {
		this.totpConfirmedAt = totpConfirmedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
