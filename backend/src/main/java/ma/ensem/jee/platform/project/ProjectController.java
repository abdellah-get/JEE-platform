package ma.ensem.jee.platform.project;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.project.dto.CreateProjectRequest;
import ma.ensem.jee.platform.project.dto.ProjectActivityResponse;
import ma.ensem.jee.platform.project.dto.ProjectMemberResponse;
import ma.ensem.jee.platform.project.dto.ProjectResponse;
import ma.ensem.jee.platform.project.dto.ReplaceMembersRequest;
import ma.ensem.jee.platform.project.dto.UpdateProjectRequest;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

	private final ProjectService projectService;

	public ProjectController(ProjectService projectService) {
		this.projectService = projectService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ProjectResponse create(@Valid @RequestBody CreateProjectRequest request) {
		return projectService.create(request);
	}

	@GetMapping
	public List<ProjectResponse> list() {
		return projectService.list();
	}

	@GetMapping("/{projectId}")
	public ProjectResponse get(@PathVariable UUID projectId) {
		return projectService.get(projectId);
	}

	@PatchMapping("/{projectId}")
	public ProjectResponse update(@PathVariable UUID projectId, @Valid @RequestBody UpdateProjectRequest request) {
		return projectService.update(projectId, request);
	}

	@GetMapping("/{projectId}/members")
	public List<ProjectMemberResponse> listMembers(@PathVariable UUID projectId) {
		return projectService.listMembers(projectId);
	}

	@PutMapping("/{projectId}/members")
	public List<ProjectMemberResponse> replaceMembers(
			@PathVariable UUID projectId,
			@Valid @RequestBody ReplaceMembersRequest request) {
		return projectService.replaceMembers(projectId, request);
	}

	@GetMapping("/{projectId}/activity")
	public List<ProjectActivityResponse> listActivity(@PathVariable UUID projectId) {
		return projectService.listActivity(projectId);
	}
}
