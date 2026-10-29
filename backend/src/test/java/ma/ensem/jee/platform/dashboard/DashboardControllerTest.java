package ma.ensem.jee.platform.dashboard;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

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
class DashboardControllerTest {

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
	void bureauSeesEnrichedKpisAndCanExportCsv() throws Exception {
		String bureauToken = registerAndPromote("bureau.dash@ensem.jee", "Bureau", "Dash", ClubRole.BUREAU);
		String chefToken = register("chef.dash@ensem.jee", "Chef", "Dash");
		String memberToken = register("member.dash@ensem.jee", "Member", "Dash");
		String chefId = userId(chefToken);
		String memberId = userId(memberToken);

		String baseline = mockMvc.perform(get("/api/v1/dashboard")
				.header("Authorization", "Bearer " + bureauToken))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();
		int brouillon = kpi(baseline, "projectsBrouillon");
		int actif = kpi(baseline, "projectsActif");
		int openTasks = kpi(baseline, "openTasks");
		int overdueTasks = kpi(baseline, "overdueTasks");

		String projectId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Dash project",
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

		String yesterday = LocalDate.now().minusDays(1).toString();
		mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "title": "Overdue task",
						  "assigneeId": "%s",
						  "dueDate": "%s"
						}
						""".formatted(memberId, yesterday)))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/v1/dashboard")
				.header("Authorization", "Bearer " + bureauToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.kpis.projectsBrouillon").value(brouillon + 1))
				.andExpect(jsonPath("$.kpis.projectsActif").value(actif))
				.andExpect(jsonPath("$.kpis.openTasks").value(openTasks + 1))
				.andExpect(jsonPath("$.kpis.overdueTasks").value(overdueTasks + 1))
				.andExpect(jsonPath("$.kpis.averageProgressPercent").exists());

		mockMvc.perform(get("/api/v1/dashboard")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.kpis").doesNotExist());

		mockMvc.perform(get("/api/v1/dashboard/export.csv")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/dashboard/export.csv")
				.header("Authorization", "Bearer " + bureauToken))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Disposition", containsString("jee-projects-export.csv")))
				.andExpect(content().contentTypeCompatibleWith("text/csv"))
				.andExpect(content().string(containsString("project_id,project_name,status,progress_percent,open_tasks,overdue_tasks")))
				.andExpect(content().string(containsString("Dash project")))
				.andExpect(content().string(containsString(",1,1")));
	}

	private static int kpi(String json, String name) {
		return ((Number) JsonPath.read(json, "$.kpis." + name)).intValue();
	}

	private String userId(String accessToken) throws Exception {
		MvcResult me = mockMvc.perform(get("/api/v1/me")
				.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andReturn();
		return JsonPath.read(me.getResponse().getContentAsString(), "$.userId");
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
