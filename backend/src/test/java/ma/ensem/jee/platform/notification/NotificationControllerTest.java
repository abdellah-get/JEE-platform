package ma.ensem.jee.platform.notification;

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
class NotificationControllerTest {

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
	void assignmentAndPinnedAnnouncementCreateNotifications() throws Exception {
		String bureauToken = registerAndPromote("bureau.notif@ensem.jee", "Bureau", "Notif", ClubRole.BUREAU);
		String chefToken = register("chef.notif@ensem.jee", "Chef", "Notif");
		String memberToken = register("member.notif@ensem.jee", "Member", "Notif");
		String chefId = userId(chefToken);
		String memberId = userId(memberToken);

		String projectId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Notif project",
								  "chefUserId": "%s"
								}
								""".formatted(chefId)))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
				.put("/api/v1/projects/" + projectId + "/members")
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "members": [
						    { "userId": "%s", "role": "CHEF_PROJET" },
						    { "userId": "%s", "role": "CONTRIBUTEUR" }
						  ]
						}
						""".formatted(chefId, memberId)))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "title": "Livrer slides",
						  "assigneeId": "%s"
						}
						""".formatted(memberId)))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/v1/notifications/unread-count")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.count").value(1));

		String notifId = JsonPath.read(
				mockMvc.perform(get("/api/v1/notifications")
						.header("Authorization", "Bearer " + memberToken))
						.andExpect(status().isOk())
						.andExpect(jsonPath("$.totalElements").value(1))
						.andExpect(jsonPath("$.content[0].type").value("TASK_ASSIGNED"))
						.andExpect(jsonPath("$.content[0].read").value(false))
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.content[0].id");

		mockMvc.perform(post("/api/v1/notifications/" + notifId + "/read")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.read").value(true));

		mockMvc.perform(post("/api/v1/announcements")
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "title": "AG urgente",
						  "body": "Demain 18h",
						  "pinned": true
						}
						"""))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/v1/notifications")
				.header("Authorization", "Bearer " + memberToken)
				.param("unreadOnly", "true"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1))
				.andExpect(jsonPath("$.content[0].type").value("ANNOUNCEMENT_PINNED"));

		mockMvc.perform(post("/api/v1/notifications/read-all")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.updated").value(1));

		mockMvc.perform(get("/api/v1/notifications/unread-count")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.count").value(0));
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

	private String userId(String token) throws Exception {
		return JsonPath.read(
				mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
						.andExpect(status().isOk())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.userId");
	}
}
