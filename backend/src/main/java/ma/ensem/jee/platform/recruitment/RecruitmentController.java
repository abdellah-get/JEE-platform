package ma.ensem.jee.platform.recruitment;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import ma.ensem.jee.platform.recruitment.dto.AssignPoleRequest;
import ma.ensem.jee.platform.recruitment.dto.CreatePoleRequest;
import ma.ensem.jee.platform.recruitment.dto.PoleResponse;
import ma.ensem.jee.platform.recruitment.dto.RecruitmentEntryResponse;
import ma.ensem.jee.platform.recruitment.dto.UpdatePoleRequest;
import ma.ensem.jee.platform.recruitment.dto.UpdateRecruitmentEntryRequest;

@RestController
@RequestMapping("/api/v1/recruitment")
public class RecruitmentController {

	private final RecruitmentService recruitmentService;

	public RecruitmentController(RecruitmentService recruitmentService) {
		this.recruitmentService = recruitmentService;
	}

	@GetMapping("/poles")
	public List<PoleResponse> listPoles(@RequestParam(defaultValue = "false") boolean activeOnly) {
		return recruitmentService.listPoles(activeOnly);
	}

	@PostMapping("/poles")
	@ResponseStatus(HttpStatus.CREATED)
	public PoleResponse createPole(@Valid @RequestBody CreatePoleRequest request) {
		return recruitmentService.createPole(request);
	}

	@PatchMapping("/poles/{id}")
	public PoleResponse updatePole(@PathVariable UUID id, @Valid @RequestBody UpdatePoleRequest request) {
		return recruitmentService.updatePole(id, request);
	}

	@GetMapping("/users/{userId}/poles")
	public List<PoleResponse> userPoles(@PathVariable UUID userId) {
		return recruitmentService.polesForUser(userId);
	}

	@PostMapping("/users/{userId}/poles")
	public List<PoleResponse> assignPole(
			@PathVariable UUID userId,
			@Valid @RequestBody AssignPoleRequest request) {
		return recruitmentService.assignPole(userId, request);
	}

	@DeleteMapping("/users/{userId}/poles/{poleId}")
	public List<PoleResponse> unassignPole(@PathVariable UUID userId, @PathVariable UUID poleId) {
		return recruitmentService.unassignPole(userId, poleId);
	}

	@GetMapping("/pipeline")
	public List<RecruitmentEntryResponse> pipeline(
			@RequestParam(required = false) RecruitmentStage stage) {
		return recruitmentService.listEntries(stage);
	}

	@PatchMapping("/pipeline/{id}")
	public RecruitmentEntryResponse updateEntry(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateRecruitmentEntryRequest request) {
		return recruitmentService.updateEntry(id, request);
	}
}
