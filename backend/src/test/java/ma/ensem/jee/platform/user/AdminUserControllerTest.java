package ma.ensem.jee.platform.user;

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

@SpringBootTest
class AdminUserControllerTest {

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
	void bureauCanToggleActiveButOnlyAdminTechChangesRoles() throws Exception {
		String bureauToken = registerAndPromote("bureau.admin@ensem.jee", "Bureau", "Admin", ClubRole.BUREAU);
		String adminToken = registerAndPromote("tech.admin@ensem.jee", "Tech", "Admin", ClubRole.ADMIN_TECH);
		String memberToken = register("member.admin@ensem.jee", "Membre", "Club");
		String memberId = userId(memberToken);

		mockMvc.perform(get("/api/v1/admin/users")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/admin/users")
				.header("Authorization", "Bearer " + bureauToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[?(@.email=='member.admin@ensem.jee')]").exists());

		mockMvc.perform(patch("/api/v1/admin/users/" + memberId + "/active")
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "active": false }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.active").value(false));

		mockMvc.perform(patch("/api/v1/admin/users/" + memberId + "/role")
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "clubRole": "BUREAU" }
						"""))
				.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/v1/admin/users/" + memberId + "/role")
				.header("Authorization", "Bearer " + adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "clubRole": "BUREAU" }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.clubRole").value("BUREAU"));

		mockMvc.perform(patch("/api/v1/admin/users/" + memberId + "/active")
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "active": true }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.active").value(true));
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
		String token = register(email, firstName, lastName);
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
