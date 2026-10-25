package ma.ensem.jee.platform.project.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.project.ProjectActivity;
import ma.ensem.jee.platform.project.ProjectActivityType;

public record ProjectActivityResponse(
		UUID id,
		UUID projectId,
		UUID actorUserId,
		String actorName,
		ProjectActivityType type,
		String message,
		UUID taskId,
		Instant createdAt) {

	public static ProjectActivityResponse from(ProjectActivity activity, String actorName) {
		return new ProjectActivityResponse(
				activity.getId(),
				activity.getProjectId(),
				activity.getActorUserId(),
				actorName,
				activity.getType(),
				activity.getMessage(),
				activity.getTaskId(),
				activity.getCreatedAt());
	}
}
