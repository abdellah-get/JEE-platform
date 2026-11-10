package ma.ensem.jee.platform.search;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@SpringBootTest
class SearchControllerTest {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private UserRepository userRepository;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
				.apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	@Test
	void bureauCanSearchProjects() throws Exception {
		String bureauToken = registerAndPromote("bureau.search@ensem.jee", ClubRole.BUREAU);

		mockMvc.perform(post("/api/v1/projects")
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Alpha Searchable","status":"ACTIF"}
						"""))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/v1/search")
				.param("q", "Alpha")
				.header("Authorization", "Bearer " + bureauToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.results[?(@.type=='PROJECT')].title")
						.value(org.hamcrest.Matchers.hasItem("Alpha Searchable")));
	}

	private String register(String email, String first, String last) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "Password123!",
						  "firstName": "%s",
						  "lastName": "%s"
						}
						""".formatted(email, first, last)))
				.andExpect(status().isCreated())
				.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
	}

	private String registerAndPromote(String email, ClubRole role) throws Exception {
		String token = register(email, "Staff", "User");
		User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
		user.setClubRole(role);
		userRepository.save(user);
		return token;
	}
}
