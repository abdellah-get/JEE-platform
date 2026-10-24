package ma.ensem.jee.platform.announcement;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.announcement.dto.AnnouncementResponse;
import ma.ensem.jee.platform.announcement.dto.CreateAnnouncementRequest;
import ma.ensem.jee.platform.announcement.dto.UpdateAnnouncementRequest;
import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class AnnouncementService {

	private final AnnouncementRepository announcementRepository;
	private final UserRepository userRepository;

	public AnnouncementService(AnnouncementRepository announcementRepository, UserRepository userRepository) {
		this.announcementRepository = announcementRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<AnnouncementResponse> list() {
		SecurityUtils.currentUser();
		return announcementRepository.findAllByOrderByPinnedDescCreatedAtDesc().stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<AnnouncementResponse> listPinned() {
		SecurityUtils.currentUser();
		return announcementRepository.findByPinnedTrueOrderByCreatedAtDesc().stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public AnnouncementResponse get(UUID id) {
		SecurityUtils.currentUser();
		Announcement announcement = announcementRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Annonce introuvable"));
		return toResponse(announcement);
	}

	@Transactional
	public AnnouncementResponse create(CreateAnnouncementRequest request) {
		UserPrincipal current = requireBureauOrAdmin();
		Announcement announcement = new Announcement(
				request.title().trim(),
				request.body().trim(),
				Boolean.TRUE.equals(request.pinned()),
				current.getId());
		announcementRepository.save(announcement);
		return toResponse(announcement);
	}

	@Transactional
	public AnnouncementResponse update(UUID id, UpdateAnnouncementRequest request) {
		requireBureauOrAdmin();
		Announcement announcement = announcementRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Annonce introuvable"));

		if (request.title() != null && !request.title().isBlank()) {
			announcement.setTitle(request.title().trim());
		}
		if (request.body() != null && !request.body().isBlank()) {
			announcement.setBody(request.body().trim());
		}
		if (request.pinned() != null) {
			announcement.setPinned(request.pinned());
		}
		return toResponse(announcement);
	}

	@Transactional
	public void delete(UUID id) {
		requireBureauOrAdmin();
		if (!announcementRepository.existsById(id)) {
			throw new ResourceNotFoundException("Annonce introuvable");
		}
		announcementRepository.deleteById(id);
	}

	private UserPrincipal requireBureauOrAdmin() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.BUREAU && current.getClubRole() != ClubRole.ADMIN_TECH) {
			throw new AccessDeniedException("Seul le bureau peut publier des annonces");
		}
		return current;
	}

	private AnnouncementResponse toResponse(Announcement announcement) {
		String authorName = userRepository.findById(announcement.getAuthorId())
				.map(u -> u.getFirstName() + " " + u.getLastName())
				.orElse("Inconnu");
		return AnnouncementResponse.from(announcement, authorName);
	}
}
