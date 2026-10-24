package ma.ensem.jee.platform.announcement;

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
import ma.ensem.jee.platform.announcement.dto.AnnouncementResponse;
import ma.ensem.jee.platform.announcement.dto.CreateAnnouncementRequest;
import ma.ensem.jee.platform.announcement.dto.UpdateAnnouncementRequest;

@RestController
@RequestMapping("/api/v1/announcements")
public class AnnouncementController {

	private final AnnouncementService announcementService;

	public AnnouncementController(AnnouncementService announcementService) {
		this.announcementService = announcementService;
	}

	@GetMapping
	public List<AnnouncementResponse> list() {
		return announcementService.list();
	}

	@GetMapping("/{id}")
	public AnnouncementResponse get(@PathVariable UUID id) {
		return announcementService.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AnnouncementResponse create(@Valid @RequestBody CreateAnnouncementRequest request) {
		return announcementService.create(request);
	}

	@PatchMapping("/{id}")
	public AnnouncementResponse update(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateAnnouncementRequest request) {
		return announcementService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		announcementService.delete(id);
	}
}
