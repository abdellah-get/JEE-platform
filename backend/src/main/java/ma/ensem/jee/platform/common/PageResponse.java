package ma.ensem.jee.platform.common;

import java.util.Collections;
import java.util.List;

import org.springframework.data.domain.Page;

public record PageResponse<T>(
		List<T> content,
		int page,
		int size,
		long totalElements,
		int totalPages,
		boolean first,
		boolean last) {

	public static final int DEFAULT_SIZE = 20;
	public static final int MAX_SIZE = 100;

	public static <T> PageResponse<T> from(Page<T> page) {
		return new PageResponse<>(
				page.getContent(),
				page.getNumber(),
				page.getSize(),
				page.getTotalElements(),
				page.getTotalPages(),
				page.isFirst(),
				page.isLast());
	}

	/** In-memory slice for lists already filtered in service layer. */
	public static <T> PageResponse<T> slice(List<T> all, int page, int size) {
		int safeSize = normalizeSize(size);
		int safePage = Math.max(page, 0);
		long total = all.size();
		int totalPages = total == 0 ? 0 : (int) Math.ceil(total / (double) safeSize);
		if (total == 0) {
			return new PageResponse<>(List.of(), safePage, safeSize, 0, 0, true, true);
		}
		int from = Math.min(safePage * safeSize, all.size());
		int to = Math.min(from + safeSize, all.size());
		List<T> content = from >= to ? List.of() : List.copyOf(all.subList(from, to));
		boolean last = safePage >= totalPages - 1;
		return new PageResponse<>(content, safePage, safeSize, total, totalPages, safePage == 0, last);
	}

	public static int normalizeSize(int size) {
		if (size < 1) {
			return DEFAULT_SIZE;
		}
		return Math.min(size, MAX_SIZE);
	}

	public static PageResponse<Void> empty(int page, int size) {
		return new PageResponse<>(Collections.emptyList(), Math.max(page, 0), normalizeSize(size), 0, 0, true, true);
	}
}
