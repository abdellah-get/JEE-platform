package ma.ensem.jee.platform.notification;

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
@Table(name = "notifications")
public class Notification {

	@Id
	private UUID id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 64)
	private NotificationType type;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(columnDefinition = "TEXT")
	private String body;

	@Column(length = 500)
	private String link;

	@Column(name = "read_at")
	private Instant readAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Notification() {
		// JPA
	}

	public Notification(UUID userId, NotificationType type, String title, String body, String link) {
		this.id = UUID.randomUUID();
		this.userId = userId;
		this.type = type;
		this.title = title;
		this.body = body;
		this.link = link;
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

	public NotificationType getType() {
		return type;
	}

	public String getTitle() {
		return title;
	}

	public String getBody() {
		return body;
	}

	public String getLink() {
		return link;
	}

	public Instant getReadAt() {
		return readAt;
	}

	public void setReadAt(Instant readAt) {
		this.readAt = readAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public boolean isRead() {
		return readAt != null;
	}
}
