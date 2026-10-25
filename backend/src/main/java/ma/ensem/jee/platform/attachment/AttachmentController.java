package ma.ensem.jee.platform.attachment;

import java.util.List;
import java.util.UUID;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ma.ensem.jee.platform.attachment.dto.AttachmentResponse;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/attachments")
public class AttachmentController {

	private final AttachmentService attachmentService;

	public AttachmentController(AttachmentService attachmentService) {
		this.attachmentService = attachmentService;
	}

	@GetMapping
	public List<AttachmentResponse> list(@PathVariable UUID projectId) {
		return attachmentService.list(projectId);
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	public AttachmentResponse upload(
			@PathVariable UUID projectId,
			@RequestParam("file") MultipartFile file,
			@RequestParam(value = "taskId", required = false) UUID taskId) {
		return attachmentService.upload(projectId, file, taskId);
	}

	@GetMapping("/{attachmentId}/download")
	public ResponseEntity<InputStreamResource> download(
			@PathVariable UUID projectId,
			@PathVariable UUID attachmentId) {
		return attachmentService.download(projectId, attachmentId);
	}

	@DeleteMapping("/{attachmentId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID projectId, @PathVariable UUID attachmentId) {
		attachmentService.delete(projectId, attachmentId);
	}
}
