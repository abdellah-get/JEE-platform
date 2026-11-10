package ma.ensem.jee.platform.audit.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.audit.AuditEvent;

public record AuditEventResponse(
		UUID id,
		UUID actorId,
		String actorEmail,
		String action,
		String targetType,
		String targetId,
		String summary,
		String metadataJson,
		Instant createdAt) {

	public static AuditEventResponse from(AuditEvent event) {
		return new AuditEventResponse(
				event.getId(),
				event.getActorId(),
				event.getActorEmail(),
				event.getAction(),
				event.getTargetType(),
				event.getTargetId(),
				event.getSummary(),
				event.getMetadataJson(),
				event.getCreatedAt());
	}
}
