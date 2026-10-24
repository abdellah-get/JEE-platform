package ma.ensem.jee.platform.task;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.task.dto.TaskResponse;
import ma.ensem.jee.platform.task.dto.UpdateTaskRequest;

@RestController
@RequestMapping("/api/v1")
public class TaskController {

	private final TaskService taskService;

	public TaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	@GetMapping("/me/tasks")
	public List<TaskResponse> myTasks(
			@RequestParam(required = false) TaskStatus status,
			@RequestParam(required = false) TaskPriority priority,
			@RequestParam(required = false) UUID projectId) {
		return taskService.listMine(status, priority, projectId);
	}

	@GetMapping("/tasks/{taskId}")
	public TaskResponse get(@PathVariable UUID taskId) {
		return taskService.get(taskId);
	}

	@PatchMapping("/tasks/{taskId}")
	public TaskResponse update(@PathVariable UUID taskId, @Valid @RequestBody UpdateTaskRequest request) {
		return taskService.update(taskId, request);
	}

	@DeleteMapping("/tasks/{taskId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID taskId) {
		taskService.delete(taskId);
	}
}
