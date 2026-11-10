package ma.ensem.jee.platform.workload;

import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ma.ensem.jee.platform.task.TaskPriority;
import ma.ensem.jee.platform.workload.dto.WorkloadResponse;

@RestController
@RequestMapping("/api/v1/admin/workload")
public class WorkloadController {

	private final WorkloadService workloadService;

	public WorkloadController(WorkloadService workloadService) {
		this.workloadService = workloadService;
	}

	@GetMapping
	public WorkloadResponse get(
			@RequestParam(required = false) UUID projectId,
			@RequestParam(required = false) TaskPriority priority) {
		return workloadService.get(projectId, priority);
	}

	@GetMapping(value = "/export.csv", produces = "text/csv;charset=UTF-8")
	public ResponseEntity<String> exportCsv(
			@RequestParam(required = false) UUID projectId,
			@RequestParam(required = false) TaskPriority priority) {
		String csv = workloadService.exportCsv(projectId, priority);
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"jee-workload-export.csv\"")
				.contentType(new MediaType("text", "csv"))
				.body(csv);
	}
}
