package ma.ensem.jee.platform.audit;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.ensem.jee.platform.audit.dto.AuditEventResponse;
import ma.ensem.jee.platform.auth.SecurityUtils;
import ma.ensem.jee.platform.auth.UserPrincipal;
import ma.ensem.jee.platform.common.PageResponse;
import ma.ensem.jee.platform.user.ClubRole;

@Service
public class AuditService {

	private final AuditEventRepository auditEventRepository;

	public AuditService(AuditEventRepository auditEventRepository) {
		this.auditEventRepository = auditEventRepository;
	}

	@Transactional
	public void record(
			UserPrincipal actor,
			String action,
			String targetType,
			UUID targetId,
			String summary,
			String metadataJson) {
		String email = actor != null ? actor.getUsername() : "system";
		UUID actorId = actor != null ? actor.getId() : null;
		String safeMeta = sanitizeMeta(metadataJson);
		auditEventRepository.save(new AuditEvent(
				actorId,
				email,
				action,
				targetType,
				targetId != null ? targetId.toString() : null,
				truncate(summary, 500),
				safeMeta));
	}

	@Transactional(readOnly = true)
	public PageResponse<AuditEventResponse> list(
			String action,
			UUID actorId,
			LocalDate from,
			LocalDate to,
			int page,
			int size) {
		requireBureauOrAdmin();
		Instant fromInstant = from != null ? from.atStartOfDay().toInstant(ZoneOffset.UTC) : null;
		Instant toInstant = to != null
				? to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC).minusMillis(1)
				: null;
		String actionFilter = action != null && !action.isBlank() ? action.trim() : null;
		Page<AuditEvent> result = auditEventRepository.search(
				actionFilter,
				actorId,
				fromInstant,
				toInstant,
				PageResponse.toPageable(page, size));
		return PageResponse.from(result.map(AuditEventResponse::from));
	}

	private void requireBureauOrAdmin() {
		UserPrincipal current = SecurityUtils.currentUser();
		if (current.getClubRole() != ClubRole.BUREAU && current.getClubRole() != ClubRole.ADMIN_TECH) {
			throw new AccessDeniedException("Réservé au bureau / admin technique");
		}
	}

	private static String sanitizeMeta(String metadataJson) {
		if (metadataJson == null || metadataJson.isBlank()) {
			return null;
		}
		String lower = metadataJson.toLowerCase();
		if (lower.contains("password") || lower.contains("token") || lower.contains("secret")) {
			return "{\"redacted\":true}";
		}
		return truncate(metadataJson, 2000);
	}

	private static String truncate(String value, int max) {
		if (value == null) {
			return "";
		}
		return value.length() <= max ? value : value.substring(0, max - 1) + "…";
	}
}
