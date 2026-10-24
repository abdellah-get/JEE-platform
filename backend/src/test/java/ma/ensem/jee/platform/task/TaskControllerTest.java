package ma.ensem.jee.platform.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class TaskControllerTest {

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
	void membersManageTasksAndProgressUpdates() throws Exception {
		String bureauToken = registerAndPromote("bureau.tasks@ensem.jee", "Bureau", "Tasks", ClubRole.BUREAU);
		String chefToken = register("chef.tasks@ensem.jee", "Chef", "Tasks");
		String outsiderToken = register("out.tasks@ensem.jee", "Out", "Tasks");
		String chefId = userId(chefToken);

		String projectId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Kanban JE",
								  "chefUserId": "%s"
								}
								""".formatted(chefId)))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		MvcResult created = mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "title": "Setup repo",
						  "priority": "HIGH",
						  "assigneeId": "%s"
						}
						""".formatted(chefId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("TODO"))
				.andExpect(jsonPath("$.assigneeId").value(chefId))
				.andReturn();

		String taskId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

		mockMvc.perform(get("/api/v1/projects/" + projectId)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.progressPercent").value(0));

		mockMvc.perform(patch("/api/v1/tasks/" + taskId)
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "status": "DONE" }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("DONE"));

		mockMvc.perform(get("/api/v1/projects/" + projectId)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.progressPercent").value(100));

		mockMvc.perform(get("/api/v1/me/tasks")
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].projectName").value("Kanban JE"));

		mockMvc.perform(get("/api/v1/projects/" + projectId + "/tasks")
				.header("Authorization", "Bearer " + outsiderToken))
				.andExpect(status().isNotFound());

		mockMvc.perform(delete("/api/v1/tasks/" + taskId)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/projects/" + projectId)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.progressPercent").value(0));
	}

	@Test
	void reorderTasksPersistsSortOrderAndStatus() throws Exception {
		String bureauToken = registerAndPromote("bureau.reorder@ensem.jee", "Bureau", "Reorder", ClubRole.BUREAU);
		String chefToken = register("chef.reorder@ensem.jee", "Chef", "Reorder");
		String chefId = userId(chefToken);

		String projectId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Reorder board",
								  "chefUserId": "%s"
								}
								""".formatted(chefId)))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		String taskA = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
						.header("Authorization", "Bearer " + chefToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "title": "A" }
								"""))
						.andExpect(status().isCreated())
						.andExpect(jsonPath("$.sortOrder").value(0))
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		String taskB = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
						.header("Authorization", "Bearer " + chefToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "title": "B" }
								"""))
						.andExpect(status().isCreated())
						.andExpect(jsonPath("$.sortOrder").value(1))
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		String taskC = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
						.header("Authorization", "Bearer " + chefToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "title": "C" }
								"""))
						.andExpect(status().isCreated())
						.andExpect(jsonPath("$.sortOrder").value(2))
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		// Colonne TODO : B, A, C
		mockMvc.perform(put("/api/v1/projects/" + projectId + "/tasks/reorder")
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "status": "TODO",
						  "taskIds": ["%s", "%s", "%s"]
						}
						""".formatted(taskB, taskA, taskC)))
				.andExpect(status().isOk());

		// C passe en IN_PROGRESS (fin de sa nouvelle colonne)
		mockMvc.perform(put("/api/v1/projects/" + projectId + "/tasks/reorder")
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "status": "IN_PROGRESS",
						  "taskIds": ["%s"]
						}
						""".formatted(taskC)))
				.andExpect(status().isOk());

		// Ordre stable après refresh : B, A (TODO) puis C (IN_PROGRESS)
		mockMvc.perform(get("/api/v1/projects/" + projectId + "/tasks")
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(taskB))
				.andExpect(jsonPath("$[0].sortOrder").value(0))
				.andExpect(jsonPath("$[0].status").value("TODO"))
				.andExpect(jsonPath("$[1].id").value(taskA))
				.andExpect(jsonPath("$[1].sortOrder").value(1))
				.andExpect(jsonPath("$[1].status").value("TODO"))
				.andExpect(jsonPath("$[2].id").value(taskC))
				.andExpect(jsonPath("$[2].status").value("IN_PROGRESS"))
				.andExpect(jsonPath("$[2].sortOrder").value(0));
	}

	@Test
	void createAndUpdateDescriptionAndDueDate() throws Exception {
		String bureauToken = registerAndPromote("bureau.due@ensem.jee", "Bureau", "Due", ClubRole.BUREAU);
		String chefToken = register("chef.due@ensem.jee", "Chef", "Due");
		String chefId = userId(chefToken);

		String projectId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Echeances",
								  "chefUserId": "%s"
								}
								""".formatted(chefId)))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		String taskId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
						.header("Authorization", "Bearer " + chefToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Livrable midterm",
								  "description": "Slides + demo",
								  "dueDate": "2026-11-15",
								  "priority": "MEDIUM"
								}
								"""))
						.andExpect(status().isCreated())
						.andExpect(jsonPath("$.description").value("Slides + demo"))
						.andExpect(jsonPath("$.dueDate").value("2026-11-15"))
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(patch("/api/v1/tasks/" + taskId)
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "title": "Livrable final",
						  "description": "Slides + demo + rapport",
						  "dueDate": "2026-12-01",
						  "priority": "HIGH"
						}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("Livrable final"))
				.andExpect(jsonPath("$.description").value("Slides + demo + rapport"))
				.andExpect(jsonPath("$.dueDate").value("2026-12-01"))
				.andExpect(jsonPath("$.priority").value("HIGH"));

		mockMvc.perform(patch("/api/v1/tasks/" + taskId)
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "description": "",
						  "clearDueDate": true
						}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.description").doesNotExist())
				.andExpect(jsonPath("$.dueDate").doesNotExist());
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
