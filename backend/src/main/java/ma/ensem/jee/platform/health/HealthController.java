package ma.ensem.jee.platform.health;

import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

	private final DataSource dataSource;

	public HealthController(DataSource dataSource) {
		this.dataSource = dataSource;
	}

	@GetMapping("/health")
	public ResponseEntity<Map<String, Object>> health() {
		String db = probeDb();
		boolean up = "UP".equals(db);

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("status", up ? "UP" : "DOWN");
		body.put("db", db);
		body.put("service", "jee-platform");
		body.put("club", "JEE ENSEM");

		return ResponseEntity.status(up ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
	}

	private String probeDb() {
		try (Connection connection = dataSource.getConnection()) {
			if (connection.isValid(2)) {
				return "UP";
			}
			return "DOWN";
		}
		catch (Exception ex) {
			return "DOWN";
		}
	}
}
