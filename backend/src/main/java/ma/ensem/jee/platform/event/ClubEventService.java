package ma.ensem.jee.platform.event;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.BadRequestException;
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.common.ResourceNotFoundException;
import ma.ensem.jee.platform.event.dto.ClubEventResponse;
import ma.ensem.jee.platform.event.dto.CreateClubEventRequest;
import ma.ensem.jee.platform.event.dto.UpdateClubEventRequest;
import ma.ensem.jee.platform.notification.NotificationService;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class ClubEventService {

	private final ClubEventRepository eventRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	public ClubEventService(
			ClubEventRepository eventRepository,
			UserRepository userRepository,
			NotificationService notificationService) {
		this.eventRepository = eventRepository;
		this.userRepository = userRepository;
		this.notificationService = notificationService;
	}

	@Transactional(readOnly = true)
	public PageResponse<ClubEventResponse> list(int page, int size) {
		SecurityUtils.currentUser();
		Page<ClubEvent> events = eventRepository
				.findAllByOrderByPinnedDescStartsAtAsc(PageResponse.toPageable(page, size));
		Map<UUID, String> creatorNames = creatorNames(events.getContent());
		return PageResponse.from(events.map(e -> ClubEventResponse.from(
				e, creatorNames.getOrDefault(e.getCreatedById(), "Inconnu"))));
	}

	@Transactional(readOnly = true)
	public ClubEventResponse get(UUID id) {
		SecurityUtils.currentUser();
		return toResponse(requireEvent(id));
	}

	@Transactional
	public ClubEventResponse create(CreateClubEventRequest request) {
		UserPrincipal current = requireBureauOrAdmin();
		validateRange(request.startsAt(), request.endsAt());
		ClubEvent event = new ClubEvent(
				request.title().trim(),
				request.description().trim(),
				blankToNull(request.location()),
				request.startsAt(),
				request.endsAt(),
				Boolean.TRUE.equals(request.pinned()),
				current.getId());
		eventRepository.save(event);
		if (event.isPinned()) {
			notificationService.notifyEventPinned(event.getId(), event.getTitle(), current.getId());
		}
		return toResponse(event);
	}

	@Transactional
	public ClubEventResponse update(UUID id, UpdateClubEventRequest request) {
		UserPrincipal current = requireBureauOrAdmin();
		ClubEvent event = requireEvent(id);
		boolean wasPinned = event.isPinned();

		if (request.title() != null && !request.title().isBlank()) {
			event.setTitle(request.title().trim());
		}
		if (request.description() != null && !request.description().isBlank()) {
			event.setDescription(request.description().trim());
		}
		if (request.location() != null) {
			event.setLocation(blankToNull(request.location()));
		}
		if (request.startsAt() != null) {
			event.setStartsAt(request.startsAt());
		}
		if (Boolean.TRUE.equals(request.clearEndsAt())) {
			event.setEndsAt(null);
		}
		else if (request.endsAt() != null) {
			event.setEndsAt(request.endsAt());
		}
		if (request.pinned() != null) {
			event.setPinned(request.pinned());
		}
		validateRange(event.getStartsAt(), event.getEndsAt());
		if (!wasPinned && event.isPinned()) {
			notificationService.notifyEventPinned(event.getId(), event.getTitle(), current.getId());
		}
		return toResponse(event);
	}

	@Transactional
	public void delete(UUID id) {
		requireBureauOrAdmin();
		if (!eventRepository.existsById(id)) {
			throw new ResourceNotFoundException("Événement introuvable");
		}
		eventRepository.deleteById(id);
	}

	private ClubEvent requireEvent(UUID id) {
		return eventRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Événement introuvable"));
	}

	private UserPrincipal requireBureauOrAdmin() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.BUREAU && current.getClubRole() != ClubRole.ADMIN_TECH) {
			throw new AccessDeniedException("Seul le bureau peut gérer les événements");
		}
		return current;
	}

	private ClubEventResponse toResponse(ClubEvent event) {
		return ClubEventResponse.from(
				event, creatorNames(List.of(event)).getOrDefault(event.getCreatedById(), "Inconnu"));
	}

	private Map<UUID, String> creatorNames(List<ClubEvent> events) {
		Set<UUID> ids = events.stream().map(ClubEvent::getCreatedById).collect(Collectors.toSet());
		if (ids.isEmpty()) {
			return Map.of();
		}
		return userRepository.findAllById(ids).stream()
				.collect(Collectors.toMap(User::getId, u -> u.getFirstName() + " " + u.getLastName()));
	}

	private static void validateRange(Instant startsAt, Instant endsAt) {
		if (startsAt != null && endsAt != null && endsAt.isBefore(startsAt)) {
			throw new BadRequestException("La fin doit être après le début");
		}
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
