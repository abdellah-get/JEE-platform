package ma.ensem.jee.platform.project.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectRole;
import ma.ensem.jee.platform.project.ProjectStatus;

public record ProjectResponse(
		UUID id,
		String name,
		String description,
		ProjectStatus status,
		UUID createdBy,
		ProjectRole myRole,
		Instant createdAt,
		Instant updatedAt) {

	public static ProjectResponse from(Project project, ProjectRole myRole) {
		return new ProjectResponse(
				project.getId(),
				project.getName(),
				project.getDescription(),
				project.getStatus(),
				project.getCreatedBy(),
				myRole,
				project.getCreatedAt(),
				project.getUpdatedAt());
	}
}
