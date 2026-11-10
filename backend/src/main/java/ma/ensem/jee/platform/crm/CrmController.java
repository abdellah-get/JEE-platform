package ma.ensem.jee.platform.crm;

import java.util.UUID;

import org.springframework.http.HttpStatus;
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
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.crm.dto.ContractResponse;
import ma.ensem.jee.platform.crm.dto.CreateContractRequest;
import ma.ensem.jee.platform.crm.dto.CreateLeadRequest;
import ma.ensem.jee.platform.crm.dto.CreateMissionRequest;
import ma.ensem.jee.platform.crm.dto.CreateQuoteRequest;
import ma.ensem.jee.platform.crm.dto.LeadResponse;
import ma.ensem.jee.platform.crm.dto.MissionResponse;
import ma.ensem.jee.platform.crm.dto.QuoteResponse;
import ma.ensem.jee.platform.crm.dto.UpdateContractRequest;
import ma.ensem.jee.platform.crm.dto.UpdateLeadRequest;
import ma.ensem.jee.platform.crm.dto.UpdateMissionRequest;
import ma.ensem.jee.platform.crm.dto.UpdateQuoteRequest;

@RestController
@RequestMapping("/api/v1/crm")
public class CrmController {

	private final CrmService crmService;

	public CrmController(CrmService crmService) {
		this.crmService = crmService;
	}

	@GetMapping("/leads")
	public PageResponse<LeadResponse> listLeads(
			@RequestParam(required = false) LeadStatus status,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "" + PageResponse.DEFAULT_SIZE) int size) {
		return crmService.listLeads(status, page, size);
	}

	@PostMapping("/leads")
	@ResponseStatus(HttpStatus.CREATED)
	public LeadResponse createLead(@Valid @RequestBody CreateLeadRequest request) {
		return crmService.createLead(request);
	}

	@PatchMapping("/leads/{id}")
	public LeadResponse updateLead(@PathVariable UUID id, @Valid @RequestBody UpdateLeadRequest request) {
		return crmService.updateLead(id, request);
	}

	@GetMapping("/missions")
	public PageResponse<MissionResponse> listMissions(
			@RequestParam(required = false) MissionStatus status,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "" + PageResponse.DEFAULT_SIZE) int size) {
		return crmService.listMissions(status, page, size);
	}

	@GetMapping("/missions/{id}")
	public MissionResponse getMission(@PathVariable UUID id) {
		return crmService.getMission(id);
	}

	@PostMapping("/missions")
	@ResponseStatus(HttpStatus.CREATED)
	public MissionResponse createMission(@Valid @RequestBody CreateMissionRequest request) {
		return crmService.createMission(request);
	}

	@PatchMapping("/missions/{id}")
	public MissionResponse updateMission(@PathVariable UUID id, @Valid @RequestBody UpdateMissionRequest request) {
		return crmService.updateMission(id, request);
	}

	@PostMapping("/missions/{id}/quotes")
	@ResponseStatus(HttpStatus.CREATED)
	public QuoteResponse createQuote(@PathVariable UUID id, @Valid @RequestBody CreateQuoteRequest request) {
		return crmService.createQuote(id, request);
	}

	@PatchMapping("/quotes/{id}")
	public QuoteResponse updateQuote(@PathVariable UUID id, @Valid @RequestBody UpdateQuoteRequest request) {
		return crmService.updateQuote(id, request);
	}

	@PostMapping("/missions/{id}/contracts")
	@ResponseStatus(HttpStatus.CREATED)
	public ContractResponse createContract(@PathVariable UUID id, @Valid @RequestBody CreateContractRequest request) {
		return crmService.createContract(id, request);
	}

	@PatchMapping("/contracts/{id}")
	public ContractResponse updateContract(@PathVariable UUID id, @Valid @RequestBody UpdateContractRequest request) {
		return crmService.updateContract(id, request);
	}
}
