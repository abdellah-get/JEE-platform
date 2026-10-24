package ma.ensem.jee.platform.task;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.task.dto.CreateTaskCommentRequest;
import ma.ensem.jee.platform.task.dto.TaskCommentResponse;
import ma.ensem.jee.platform.task.dto.UpdateTaskCommentRequest;

@RestController
@RequestMapping("/api/v1")
public class TaskCommentController {

	private final TaskCommentService commentService;

	public TaskCommentController(TaskCommentService commentService) {
		this.commentService = commentService;
	}

	@GetMapping("/tasks/{taskId}/comments")
	public List<TaskCommentResponse> list(@PathVariable UUID taskId) {
		return commentService.listByTask(taskId);
	}

	@PostMapping("/tasks/{taskId}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	public TaskCommentResponse create(
			@PathVariable UUID taskId,
			@Valid @RequestBody CreateTaskCommentRequest request) {
		return commentService.create(taskId, request);
	}

	@PatchMapping("/comments/{commentId}")
	public TaskCommentResponse update(
			@PathVariable UUID commentId,
			@Valid @RequestBody UpdateTaskCommentRequest request) {
		return commentService.update(commentId, request);
	}

	@DeleteMapping("/comments/{commentId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID commentId) {
		commentService.delete(commentId);
	}
}
