package ma.ensem.jee.platform.announcement;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class AnnouncementControllerTest {

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
	void bureauPublishesPinnedAnnouncementVisibleOnDashboard() throws Exception {
		String bureauToken = registerAndPromote("bureau.news@ensem.jee", "Bureau", "News", ClubRole.BUREAU);
		String memberToken = register("member.news@ensem.jee", "Membre", "News");

		mockMvc.perform(post("/api/v1/announcements")
				.header("Authorization", "Bearer " + memberToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "title": "Interdit", "body": "non" }
						"""))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/v1/announcements")
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "title": "AG demain",
						  "body": "Présence obligatoire",
						  "pinned": true
						}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.pinned").value(true));

		mockMvc.perform(get("/api/v1/announcements")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].title").value("AG demain"))
				.andExpect(jsonPath("$[0].pinned").value(true));

		mockMvc.perform(get("/api/v1/dashboard")
				.header("Authorization", "Bearer " + bureauToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pinnedAnnouncements[0].title").value("AG demain"))
				.andExpect(jsonPath("$.kpis.pinnedAnnouncements").value(1));

		mockMvc.perform(get("/api/v1/dashboard")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.kpis").doesNotExist());
	}

	@Test
	void bureauCanEditAnnouncementTitleAndBody() throws Exception {
		String bureauToken = registerAndPromote("bureau.edit@ensem.jee", "Bureau", "Edit", ClubRole.BUREAU);
		String memberToken = register("member.edit@ensem.jee", "Membre", "Edit");

		String id = JsonPath.read(
				mockMvc.perform(post("/api/v1/announcements")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Brouillon",
								  "body": "Texte initial",
								  "pinned": false
								}
								"""))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(patch("/api/v1/announcements/" + id)
				.header("Authorization", "Bearer " + memberToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "title": "Hack" }
						"""))
				.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/v1/announcements/" + id)
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "title": "AG reportée",
						  "body": "Nouvelle date vendredi"
						}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("AG reportée"))
				.andExpect(jsonPath("$.body").value("Nouvelle date vendredi"))
				.andExpect(jsonPath("$.pinned").value(false));

		mockMvc.perform(get("/api/v1/announcements/" + id)
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("AG reportée"))
				.andExpect(jsonPath("$.body").value("Nouvelle date vendredi"));
	}

	private String register(String email, String firstName, String lastName) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "Password123!",
						  "firstName": "%s",
						  "lastName": "%s"
						}
						""".formatted(email, firstName, lastName)))
				.andExpect(status().isCreated())
				.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
	}

	private String registerAndPromote(String email, String firstName, String lastName, ClubRole role) throws Exception {
		register(email, firstName, lastName);
		User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
		user.setClubRole(role);
		userRepository.save(user);

		MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "Password123!"
						}
						""".formatted(email)))
				.andExpect(status().isOk())
				.andReturn();
		return JsonPath.read(login.getResponse().getContentAsString(), "$.accessToken");
	}
}
