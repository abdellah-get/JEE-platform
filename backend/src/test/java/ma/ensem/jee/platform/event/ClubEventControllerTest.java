package ma.ensem.jee.platform.event;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

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

import ma.ensem.jee.platform.project.Project;
import ma.ensem.jee.platform.project.ProjectMember;
import ma.ensem.jee.platform.project.ProjectMemberRepository;
import ma.ensem.jee.platform.project.ProjectRepository;
import ma.ensem.jee.platform.project.ProjectRole;
import ma.ensem.jee.platform.project.ProjectStatus;
import ma.ensem.jee.platform.task.Task;
import ma.ensem.jee.platform.task.TaskPriority;
import ma.ensem.jee.platform.task.TaskRepository;
import ma.ensem.jee.platform.task.TaskStatus;
import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@SpringBootTest
class ClubEventControllerTest {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ProjectRepository projectRepository;

	@Autowired
	private ProjectMemberRepository projectMemberRepository;

	@Autowired
	private TaskRepository taskRepository;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
				.apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	@Test
	void bureauCreatesPinnedEventAndMemberSeesCalendar() throws Exception {
		String bureauToken = registerAndPromote("bureau.events@ensem.jee", "Bureau", "Events", ClubRole.BUREAU);
		String memberToken = register("member.events@ensem.jee", "Membre", "Events");

		Instant starts = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
		Instant ends = starts.plus(2, ChronoUnit.HOURS);

		mockMvc.perform(post("/api/v1/events")
				.header("Authorization", "Bearer " + memberToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "title": "Interdit",
						  "description": "non",
						  "startsAt": "%s"
						}
						""".formatted(starts)))
				.andExpect(status().isForbidden());

		String eventId = JsonPath.read(
				mockMvc.perform(post("/api/v1/events")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "AG Formation",
								  "description": "Pitch client",
								  "location": "Amphi A",
								  "startsAt": "%s",
								  "endsAt": "%s",
								  "pinned": true
								}
								""".formatted(starts, ends)))
						.andExpect(status().isCreated())
						.andExpect(jsonPath("$.pinned").value(true))
						.andExpect(jsonPath("$.location").value("Amphi A"))
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(get("/api/v1/events")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].title").value("AG Formation"))
				.andExpect(jsonPath("$.content[0].pinned").value(true));

		mockMvc.perform(get("/api/v1/events/" + eventId)
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.description").value("Pitch client"));

		mockMvc.perform(get("/api/v1/notifications")
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].type").value("EVENT_PINNED"));

		User member = userRepository.findByEmailIgnoreCase("member.events@ensem.jee").orElseThrow();
		Project project = projectRepository.save(new Project(
				"Calendrier Due", "test", ProjectStatus.ACTIF, member.getId()));
		projectMemberRepository.save(new ProjectMember(project.getId(), member.getId(), ProjectRole.CONTRIBUTEUR));
		LocalDate due = LocalDate.ofInstant(starts, ZoneOffset.UTC);
		taskRepository.save(new Task(
				project.getId(),
				"Livrable pitch",
				null,
				TaskStatus.TODO,
				TaskPriority.HIGH,
				member.getId(),
				due,
				0,
				member.getId()));

		LocalDate from = due.minusDays(1);
		LocalDate to = due.plusDays(1);

		mockMvc.perform(get("/api/v1/calendar")
				.param("from", from.toString())
				.param("to", to.toString())
				.header("Authorization", "Bearer " + memberToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.type == 'EVENT')].title").value(org.hamcrest.Matchers.hasItem("AG Formation")))
				.andExpect(jsonPath("$[?(@.type == 'TASK_DUE')].title").value(org.hamcrest.Matchers.hasItem("Livrable pitch")));

		mockMvc.perform(patch("/api/v1/events/" + eventId)
				.header("Authorization", "Bearer " + bureauToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "title": "AG Formation (reportée)" }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("AG Formation (reportée)"));
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
