package ma.ensem.jee.platform.search.dto;

import java.util.List;

public record SearchResponse(String query, List<SearchHitResponse> results) {
}
