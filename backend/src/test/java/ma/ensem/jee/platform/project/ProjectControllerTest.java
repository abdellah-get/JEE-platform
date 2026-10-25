package ma.ensem.jee.platform.project;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class ProjectControllerTest {

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
	void bureauCreatesProjectMemberSeesOnlyOwnTeamAndOutsiderGets404() throws Exception {
		String bureauToken = registerAndPromote("bureau.p1@ensem.jee", "Bureau", "One", ClubRole.BUREAU);
		String chefToken = register("chef.p1@ensem.jee", "Chef", "Projet");
		String outsiderToken = register("outsider.p1@ensem.jee", "Hors", "Equipe");

		String chefUserId = JsonPath.read(
				mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + chefToken))
						.andExpect(status().isOk())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.userId");

		MvcResult created = mockMvc.perform(post("/api/v1/projects")
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "name": "Site Junior",
						  "description": "Refonte site JE",
						  "status": "ACTIF",
						  "chefUserId": "%s"
						}
						""".formatted(chefUserId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("Site Junior"))
				.andExpect(jsonPath("$.status").value("ACTIF"))
				.andReturn();

		String projectId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

		mockMvc.perform(get("/api/v1/projects")
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(projectId))
				.andExpect(jsonPath("$[0].myRole").value("CHEF_PROJET"));

		mockMvc.perform(get("/api/v1/projects")
				.header("Authorization", "Bearer " + outsiderToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));

		mockMvc.perform(get("/api/v1/projects/" + projectId)
				.header("Authorization", "Bearer " + outsiderToken))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Projet introuvable"));

		mockMvc.perform(get("/api/v1/projects/" + projectId)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Site Junior"));

		mockMvc.perform(post("/api/v1/projects")
				.header("Authorization", "Bearer " + outsiderToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "name": "Interdit" }
						"""))
				.andExpect(status().isForbidden());
	}

	@Test
	void chefCanManageTeamAndPatchProject() throws Exception {
		String bureauToken = registerAndPromote("bureau.team@ensem.jee", "Bureau", "Two", ClubRole.BUREAU);
		String chefToken = register("chef.team@ensem.jee", "Chef", "Team");
		String contribToken = register("contrib.team@ensem.jee", "Contrib", "Team");

		String chefUserId = userId(chefToken);
		String contribUserId = userId(contribToken);

		String projectId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "App mobile",
								  "chefUserId": "%s"
								}
								""".formatted(chefUserId)))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(put("/api/v1/projects/" + projectId + "/members")
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "members": [
						    { "userId": "%s", "role": "CHEF_PROJET" },
						    { "userId": "%s", "role": "CONTRIBUTEUR" }
						  ]
						}
						""".formatted(chefUserId, contribUserId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2));

		mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
				.header("Authorization", "Bearer " + contribToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2));

		mockMvc.perform(patch("/api/v1/projects/" + projectId)
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "status": "ACTIF", "name": "App mobile JE" }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ACTIF"))
				.andExpect(jsonPath("$.name").value("App mobile JE"));

		mockMvc.perform(patch("/api/v1/projects/" + projectId)
				.header("Authorization", "Bearer " + contribToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "status": "TERMINE" }
						"""))
				.andExpect(status().isForbidden());
	}

	@Test
	void projectActivityRecordsTaskAndMemberEventsWithIsolation() throws Exception {
		String bureauToken = registerAndPromote("bureau.act@ensem.jee", "Bureau", "Act", ClubRole.BUREAU);
		String chefToken = register("chef.act@ensem.jee", "Chef", "Act");
		String contribToken = register("contrib.act@ensem.jee", "Contrib", "Act");
		String outsiderToken = register("out.act@ensem.jee", "Out", "Act");
		String chefId = userId(chefToken);
		String contribId = userId(contribToken);

		String projectId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Activity project",
								  "chefUserId": "%s"
								}
								""".formatted(chefId)))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(put("/api/v1/projects/" + projectId + "/members")
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "members": [
						    { "userId": "%s", "role": "CHEF_PROJET" },
						    { "userId": "%s", "role": "CONTRIBUTEUR" }
						  ]
						}
						""".formatted(chefId, contribId)))
				.andExpect(status().isOk());

		String taskId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
						.header("Authorization", "Bearer " + chefToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "title": "Suivi activité" }
								"""))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(patch("/api/v1/tasks/" + taskId)
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "status": "IN_PROGRESS" }
						"""))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/projects/" + projectId + "/activity")
				.header("Authorization", "Bearer " + contribToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.type=='TASK_CREATED')]").isNotEmpty())
				.andExpect(jsonPath("$[?(@.type=='TASK_STATUS_CHANGED')]").isNotEmpty())
				.andExpect(jsonPath("$[?(@.type=='MEMBER_ADDED')]").isNotEmpty());

		mockMvc.perform(get("/api/v1/projects/" + projectId + "/activity")
				.header("Authorization", "Bearer " + outsiderToken))
				.andExpect(status().isNotFound());
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
