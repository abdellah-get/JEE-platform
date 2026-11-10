package ma.ensem.jee.platform.search.dto;

public record SearchHitResponse(
		String type,
		String id,
		String title,
		String subtitle,
		String href) {
}
