package ma.ensem.jee.platform.attachment.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.attachment.ProjectAttachment;

public record AttachmentResponse(
		UUID id,
		UUID projectId,
		UUID taskId,
		UUID uploadedById,
		String uploadedByName,
		String originalName,
		String contentType,
		long sizeBytes,
		Instant createdAt) {

	public static AttachmentResponse from(ProjectAttachment attachment, String uploadedByName) {
		return new AttachmentResponse(
				attachment.getId(),
				attachment.getProjectId(),
				attachment.getTaskId(),
				attachment.getUploadedById(),
				uploadedByName,
				attachment.getOriginalName(),
				attachment.getContentType(),
				attachment.getSizeBytes(),
				attachment.getCreatedAt());
	}
}
