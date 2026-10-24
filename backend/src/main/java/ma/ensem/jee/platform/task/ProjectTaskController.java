package ma.ensem.jee.platform.task;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.task.dto.CreateTaskRequest;
import ma.ensem.jee.platform.task.dto.TaskResponse;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/tasks")
public class ProjectTaskController {

	private final TaskService taskService;

	public ProjectTaskController(TaskService taskService) {
		this.taskService = taskService;
	}

	@GetMapping
	public List<TaskResponse> list(@PathVariable UUID projectId) {
		return taskService.listByProject(projectId);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public TaskResponse create(@PathVariable UUID projectId, @Valid @RequestBody CreateTaskRequest request) {
		return taskService.create(projectId, request);
	}
}
