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
import ma.ensem.jee.platform.event.dto.EventRsvpResponse;
import ma.ensem.jee.platform.event.dto.UpdateClubEventRequest;
import ma.ensem.jee.platform.event.dto.UpsertEventRsvpRequest;
import ma.ensem.jee.platform.notification.NotificationService;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@Service
public class ClubEventService {

	private final ClubEventRepository eventRepository;
	private final EventRsvpRepository rsvpRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	public ClubEventService(
			ClubEventRepository eventRepository,
			EventRsvpRepository rsvpRepository,
			UserRepository userRepository,
			NotificationService notificationService) {
		this.eventRepository = eventRepository;
		this.rsvpRepository = rsvpRepository;
		this.userRepository = userRepository;
		this.notificationService = notificationService;
	}

	@Transactional(readOnly = true)
	public PageResponse<ClubEventResponse> list(int page, int size) {
		UserPrincipal current = SecurityUtils.currentUser();
		Page<ClubEvent> events = eventRepository
				.findAllByOrderByPinnedDescStartsAtAsc(PageResponse.toPageable(page, size));
		Map<UUID, String> creatorNames = creatorNames(events.getContent());
		Map<UUID, EventRsvpStatus> myRsvps = myRsvps(events.getContent(), current.getId());
		return PageResponse.from(events.map(e -> toResponse(
				e,
				creatorNames.getOrDefault(e.getCreatedById(), "Inconnu"),
				myRsvps.get(e.getId()))));
	}

	@Transactional(readOnly = true)
	public ClubEventResponse get(UUID id) {
		UserPrincipal current = SecurityUtils.currentUser();
		ClubEvent event = requireEvent(id);
		EventRsvpStatus myRsvp = rsvpRepository.findByEventIdAndUserId(id, current.getId())
				.map(EventRsvp::getStatus)
				.orElse(null);
		return toResponse(event, creatorName(event.getCreatedById()), myRsvp);
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
		return toResponse(event, creatorName(event.getCreatedById()), null);
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
		EventRsvpStatus myRsvp = rsvpRepository.findByEventIdAndUserId(id, current.getId())
				.map(EventRsvp::getStatus)
				.orElse(null);
		return toResponse(event, creatorName(event.getCreatedById()), myRsvp);
	}

	@Transactional
	public void delete(UUID id) {
		requireBureauOrAdmin();
		if (!eventRepository.existsById(id)) {
			throw new ResourceNotFoundException("Événement introuvable");
		}
		eventRepository.deleteById(id);
	}

	@Transactional
	public ClubEventResponse upsertRsvp(UUID eventId, UpsertEventRsvpRequest request) {
		UserPrincipal current = SecurityUtils.currentUser();
		ClubEvent event = requireEvent(eventId);
		EventRsvpStatus previous = null;
		EventRsvp rsvp = rsvpRepository.findByEventIdAndUserId(eventId, current.getId()).orElse(null);
		if (rsvp == null) {
			rsvp = new EventRsvp(eventId, current.getId(), request.status());
		}
		else {
			previous = rsvp.getStatus();
			rsvp.setStatus(request.status());
		}
		rsvpRepository.save(rsvp);

		if (previous != request.status()) {
			String actorName = userRepository.findById(current.getId())
					.map(u -> u.getFirstName() + " " + u.getLastName())
					.orElse("Un membre");
			notificationService.notifyEventRsvp(
					event.getCreatedById(),
					current.getId(),
					actorName,
					event.getId(),
					event.getTitle(),
					request.status().name());
		}
		return toResponse(event, creatorName(event.getCreatedById()), request.status());
	}

	@Transactional
	public ClubEventResponse clearRsvp(UUID eventId) {
		UserPrincipal current = SecurityUtils.currentUser();
		ClubEvent event = requireEvent(eventId);
		rsvpRepository.deleteByEventIdAndUserId(eventId, current.getId());
		return toResponse(event, creatorName(event.getCreatedById()), null);
	}

	@Transactional(readOnly = true)
	public List<EventRsvpResponse> listRsvps(UUID eventId) {
		requireBureauOrAdmin();
		requireEvent(eventId);
		List<EventRsvp> rsvps = rsvpRepository.findByEventIdOrderByUpdatedAtDesc(eventId);
		Set<UUID> userIds = rsvps.stream().map(EventRsvp::getUserId).collect(Collectors.toSet());
		Map<UUID, User> users = userRepository.findAllById(userIds).stream()
				.collect(Collectors.toMap(User::getId, u -> u));
		return rsvps.stream()
				.map(r -> {
					User u = users.get(r.getUserId());
					String name = u == null ? "Inconnu" : u.getFirstName() + " " + u.getLastName();
					String email = u == null ? "" : u.getEmail();
					return EventRsvpResponse.from(r, name, email);
				})
				.toList();
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

	private ClubEventResponse toResponse(ClubEvent event, String createdByName, EventRsvpStatus myRsvp) {
		return ClubEventResponse.from(
				event,
				createdByName,
				myRsvp,
				rsvpRepository.countByEventIdAndStatus(event.getId(), EventRsvpStatus.GOING),
				rsvpRepository.countByEventIdAndStatus(event.getId(), EventRsvpStatus.MAYBE),
				rsvpRepository.countByEventIdAndStatus(event.getId(), EventRsvpStatus.DECLINED));
	}

	private Map<UUID, EventRsvpStatus> myRsvps(List<ClubEvent> events, UUID userId) {
		Set<UUID> ids = events.stream().map(ClubEvent::getId).collect(Collectors.toSet());
		if (ids.isEmpty()) {
			return Map.of();
		}
		return rsvpRepository.findByEventIdInAndUserId(ids, userId).stream()
				.collect(Collectors.toMap(EventRsvp::getEventId, EventRsvp::getStatus));
	}

	private String creatorName(UUID createdById) {
		return userRepository.findById(createdById)
				.map(u -> u.getFirstName() + " " + u.getLastName())
				.orElse("Inconnu");
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
