package ma.ensem.jee.platform.attachment;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.BadRequestException;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.attachment.dto.AttachmentResponse;
import ma.ensem.jee.platform.project.ProjectAccessService;
import ma.ensem.jee.platform.project.ProjectRole;
import ma.ensem.jee.platform.task.Task;
import ma.ensem.jee.platform.task.TaskRepository;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class AttachmentService {

	private final ProjectAttachmentRepository attachmentRepository;
	private final AttachmentStorage storage;
	private final AttachmentProperties properties;
	private final ProjectAccessService accessService;
	private final TaskRepository taskRepository;
	private final UserRepository userRepository;

	public AttachmentService(
			ProjectAttachmentRepository attachmentRepository,
			AttachmentStorage storage,
			AttachmentProperties properties,
			ProjectAccessService accessService,
			TaskRepository taskRepository,
			UserRepository userRepository) {
		this.attachmentRepository = attachmentRepository;
		this.storage = storage;
		this.properties = properties;
		this.accessService = accessService;
		this.taskRepository = taskRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<AttachmentResponse> list(UUID projectId) {
		UserPrincipal user = SecurityUtils.currentUser();
		accessService.requireVisibleProject(projectId, user);
		List<ProjectAttachment> attachments =
				attachmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
		return toResponses(attachments);
	}

	@Transactional
	public AttachmentResponse upload(UUID projectId, MultipartFile file, UUID taskId) {
		UserPrincipal user = SecurityUtils.currentUser();
		accessService.requireVisibleProject(projectId, user);

		if (file == null || file.isEmpty()) {
			throw new BadRequestException("Fichier manquant");
		}
		if (file.getSize() > properties.getMaxSizeBytes()) {
			throw new BadRequestException(
					"Fichier trop volumineux (max "
							+ (properties.getMaxSizeBytes() / (1024 * 1024))
							+ " Mo)");
		}

		String contentType = normalizeContentType(file.getContentType());
		if (!properties.allowedContentTypeList().contains(contentType)) {
			throw new BadRequestException("Type de fichier non autorisé: " + contentType);
		}

		String originalName = sanitizeFileName(file.getOriginalFilename());
		if (taskId != null) {
			Task task = taskRepository.findById(taskId)
					.orElseThrow(() -> new ResourceNotFoundException("Tâche introuvable"));
			if (!task.getProjectId().equals(projectId)) {
				throw new BadRequestException("La tâche n'appartient pas à ce projet");
			}
		}

		UUID attachmentId = UUID.randomUUID();
		String storageKey = projectId + "/" + attachmentId;
		try (InputStream in = file.getInputStream()) {
			storage.store(storageKey, in, file.getSize());
		}
		catch (IOException ex) {
			throw new BadRequestException("Échec de l'enregistrement du fichier");
		}

		ProjectAttachment saved = attachmentRepository.save(new ProjectAttachment(
				projectId,
				taskId,
				user.getId(),
				originalName,
				contentType,
				file.getSize(),
				storageKey));

		String uploaderName = userRepository.findById(user.getId())
				.map(u -> u.getFirstName() + " " + u.getLastName())
				.orElse("Membre");
		return AttachmentResponse.from(saved, uploaderName);
	}

	@Transactional(readOnly = true)
	public ResponseEntity<InputStreamResource> download(UUID projectId, UUID attachmentId) {
		UserPrincipal user = SecurityUtils.currentUser();
		accessService.requireVisibleProject(projectId, user);

		ProjectAttachment attachment = attachmentRepository.findByIdAndProjectId(attachmentId, projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Pièce jointe introuvable"));

		try {
			InputStream stream = storage.open(attachment.getStorageKey());
			InputStreamResource body = new InputStreamResource(stream);
			return ResponseEntity.ok()
					.header(
							HttpHeaders.CONTENT_DISPOSITION,
							"attachment; filename=\"" + attachment.getOriginalName().replace("\"", "") + "\"")
					.contentType(MediaType.parseMediaType(attachment.getContentType()))
					.contentLength(attachment.getSizeBytes())
					.body(body);
		}
		catch (IOException ex) {
			throw new ResourceNotFoundException("Fichier introuvable sur le stockage");
		}
	}

	@Transactional
	public void delete(UUID projectId, UUID attachmentId) {
		UserPrincipal user = SecurityUtils.currentUser();
		accessService.requireVisibleProject(projectId, user);

		ProjectAttachment attachment = attachmentRepository.findByIdAndProjectId(attachmentId, projectId)
				.orElseThrow(() -> new ResourceNotFoundException("Pièce jointe introuvable"));

		boolean owner = attachment.getUploadedById().equals(user.getId());
		boolean chef = accessService.findRole(projectId, user.getId())
				.map(role -> role == ProjectRole.CHEF_PROJET)
				.orElse(false);
		if (!owner && !chef && !accessService.isClubStaff(user)) {
			throw new AccessDeniedException("Tu ne peux pas supprimer cette pièce jointe");
		}

		attachmentRepository.delete(attachment);
		try {
			storage.delete(attachment.getStorageKey());
		}
		catch (IOException ex) {
			// DB row already removed; ignore orphan blob cleanup failure
		}
	}

	private List<AttachmentResponse> toResponses(List<ProjectAttachment> attachments) {
		Set<UUID> uploaderIds = attachments.stream()
				.map(ProjectAttachment::getUploadedById)
				.collect(Collectors.toSet());
		Map<UUID, String> names = userRepository.findAllById(uploaderIds).stream()
				.collect(Collectors.toMap(
						User::getId,
						u -> u.getFirstName() + " " + u.getLastName()));
		return attachments.stream()
				.map(a -> AttachmentResponse.from(a, names.getOrDefault(a.getUploadedById(), "Membre")))
				.toList();
	}

	private static String normalizeContentType(String raw) {
		if (raw == null || raw.isBlank()) {
			return "application/octet-stream";
		}
		return raw.split(";")[0].trim().toLowerCase(Locale.ROOT);
	}

	private static String sanitizeFileName(String name) {
		if (name == null || name.isBlank()) {
			return "fichier";
		}
		String base = PathSafe.baseName(name);
		if (base.length() > 200) {
			base = base.substring(0, 200);
		}
		return base.isBlank() ? "fichier" : base;
	}

	/** Minimal path traversal guard for display names. */
	private static final class PathSafe {
		static String baseName(String name) {
			String n = name.replace('\\', '/');
			int slash = n.lastIndexOf('/');
			return slash >= 0 ? n.substring(slash + 1) : n;
		}
	}
}
