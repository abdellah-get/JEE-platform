package ma.ensem.jee.platform.dashboard;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ma.ensem.jee.platform.dashboard.dto.DashboardResponse;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

	private final DashboardService dashboardService;

	public DashboardController(DashboardService dashboardService) {
		this.dashboardService = dashboardService;
	}

	@GetMapping
	public DashboardResponse get() {
		return dashboardService.get();
	}

	@GetMapping(value = "/export.csv", produces = "text/csv;charset=UTF-8")
	public ResponseEntity<String> exportCsv() {
		String csv = dashboardService.exportProjectsCsv();
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"jee-projects-export.csv\"")
				.contentType(new MediaType("text", "csv"))
				.body(csv);
	}
}
