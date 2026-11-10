package ma.ensem.jee.platform.search;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ma.ensem.jee.platform.search.dto.SearchResponse;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

	private final SearchService searchService;

	public SearchController(SearchService searchService) {
		this.searchService = searchService;
	}

	@GetMapping
	public SearchResponse search(@RequestParam(name = "q", defaultValue = "") String q) {
		return searchService.search(q);
	}
}
