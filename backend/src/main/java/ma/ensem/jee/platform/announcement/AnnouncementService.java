package ma.ensem.jee.platform.announcement;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.announcement.dto.AnnouncementResponse;
import ma.ensem.jee.platform.announcement.dto.CreateAnnouncementRequest;
import ma.ensem.jee.platform.announcement.dto.UpdateAnnouncementRequest;
import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.notification.NotificationService;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class AnnouncementService {

	private final AnnouncementRepository announcementRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	public AnnouncementService(
			AnnouncementRepository announcementRepository,
			UserRepository userRepository,
			NotificationService notificationService) {
		this.announcementRepository = announcementRepository;
		this.userRepository = userRepository;
		this.notificationService = notificationService;
	}

	@Transactional(readOnly = true)
	public PageResponse<AnnouncementResponse> list(int page, int size) {
		SecurityUtils.currentUser();
		Page<Announcement> announcements = announcementRepository
				.findAllByOrderByPinnedDescCreatedAtDesc(PageResponse.toPageable(page, size));
		Map<UUID, String> authorNames = authorNames(announcements.getContent());
		return PageResponse.from(announcements.map(a -> AnnouncementResponse.from(
				a, authorNames.getOrDefault(a.getAuthorId(), "Inconnu"))));
	}

	@Transactional(readOnly = true)
	public List<AnnouncementResponse> listPinned() {
		SecurityUtils.currentUser();
		List<Announcement> pinned = announcementRepository.findByPinnedTrueOrderByCreatedAtDesc();
		Map<UUID, String> authorNames = authorNames(pinned);
		return pinned.stream()
				.map(a -> AnnouncementResponse.from(a, authorNames.getOrDefault(a.getAuthorId(), "Inconnu")))
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
		if (announcement.isPinned()) {
			notificationService.notifyAnnouncementPinned(
					announcement.getId(), announcement.getTitle(), current.getId());
		}
		return toResponse(announcement);
	}

	@Transactional
	public AnnouncementResponse update(UUID id, UpdateAnnouncementRequest request) {
		UserPrincipal current = requireBureauOrAdmin();
		Announcement announcement = announcementRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Annonce introuvable"));

		boolean wasPinned = announcement.isPinned();
		if (request.title() != null && !request.title().isBlank()) {
			announcement.setTitle(request.title().trim());
		}
		if (request.body() != null && !request.body().isBlank()) {
			announcement.setBody(request.body().trim());
		}
		if (request.pinned() != null) {
			announcement.setPinned(request.pinned());
		}
		if (!wasPinned && announcement.isPinned()) {
			notificationService.notifyAnnouncementPinned(
					announcement.getId(), announcement.getTitle(), current.getId());
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
		return AnnouncementResponse.from(
				announcement, authorNames(List.of(announcement)).getOrDefault(announcement.getAuthorId(), "Inconnu"));
	}

	private Map<UUID, String> authorNames(List<Announcement> announcements) {
		Set<UUID> ids = announcements.stream().map(Announcement::getAuthorId).collect(Collectors.toSet());
		if (ids.isEmpty()) {
			return Map.of();
		}
		return userRepository.findAllById(ids).stream()
				.collect(Collectors.toMap(User::getId, u -> u.getFirstName() + " " + u.getLastName()));
	}
}
