package ma.ensem.jee.platform.task.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.task.TaskComment;

public record TaskCommentResponse(
		UUID id,
		UUID taskId,
		UUID authorId,
		String authorName,
		String body,
		Instant createdAt,
		Instant updatedAt) {

	public static TaskCommentResponse from(TaskComment comment, String authorName) {
		return new TaskCommentResponse(
				comment.getId(),
				comment.getTaskId(),
				comment.getAuthorId(),
				authorName,
				comment.getBody(),
				comment.getCreatedAt(),
				comment.getUpdatedAt());
	}
}
