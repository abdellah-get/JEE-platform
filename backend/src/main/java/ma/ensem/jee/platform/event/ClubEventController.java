package ma.ensem.jee.platform.event;

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
import ma.ensem.jee.platform.event.dto.ClubEventResponse;
import ma.ensem.jee.platform.event.dto.CreateClubEventRequest;
import ma.ensem.jee.platform.event.dto.UpdateClubEventRequest;

@RestController
@RequestMapping("/api/v1/events")
public class ClubEventController {

	private final ClubEventService eventService;

	public ClubEventController(ClubEventService eventService) {
		this.eventService = eventService;
	}

	@GetMapping
	public List<ClubEventResponse> list() {
		return eventService.list();
	}

	@GetMapping("/{id}")
	public ClubEventResponse get(@PathVariable UUID id) {
		return eventService.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ClubEventResponse create(@Valid @RequestBody CreateClubEventRequest request) {
		return eventService.create(request);
	}

	@PatchMapping("/{id}")
	public ClubEventResponse update(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateClubEventRequest request) {
		return eventService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		eventService.delete(id);
	}
}
