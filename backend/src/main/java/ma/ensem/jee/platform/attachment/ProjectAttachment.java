package ma.ensem.jee.platform.attachment;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_attachments")
public class ProjectAttachment {

	@Id
	private UUID id;

	@Column(name = "project_id", nullable = false)
	private UUID projectId;

	@Column(name = "task_id")
	private UUID taskId;

	@Column(name = "uploaded_by_id", nullable = false)
	private UUID uploadedById;

	@Column(name = "original_name", nullable = false, length = 255)
	private String originalName;

	@Column(name = "content_type", nullable = false, length = 120)
	private String contentType;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	@Column(name = "storage_key", nullable = false, length = 512, unique = true)
	private String storageKey;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected ProjectAttachment() {
		// JPA
	}

	public ProjectAttachment(
			UUID projectId,
			UUID taskId,
			UUID uploadedById,
			String originalName,
			String contentType,
			long sizeBytes,
			String storageKey) {
		this.id = UUID.randomUUID();
		this.projectId = projectId;
		this.taskId = taskId;
		this.uploadedById = uploadedById;
		this.originalName = originalName;
		this.contentType = contentType;
		this.sizeBytes = sizeBytes;
		this.storageKey = storageKey;
	}

	@PrePersist
	void onCreate() {
		if (this.id == null) {
			this.id = UUID.randomUUID();
		}
		if (this.createdAt == null) {
			this.createdAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public UUID getProjectId() {
		return projectId;
	}

	public UUID getTaskId() {
		return taskId;
	}

	public UUID getUploadedById() {
		return uploadedById;
	}

	public String getOriginalName() {
		return originalName;
	}

	public String getContentType() {
		return contentType;
	}

	public long getSizeBytes() {
		return sizeBytes;
	}

	public String getStorageKey() {
		return storageKey;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
