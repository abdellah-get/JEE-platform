package ma.ensem.jee.platform.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class TaskCommentControllerTest {

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
	void membersCommentOnTasksOutsidersGetNotFound() throws Exception {
		String bureauToken = registerAndPromote("bureau.comments@ensem.jee", "Bureau", "Comments", ClubRole.BUREAU);
		String chefToken = register("chef.comments@ensem.jee", "Chef", "Comments");
		String memberToken = register("member.comments@ensem.jee", "Member", "Comments");
		String outsiderToken = register("out.comments@ensem.jee", "Out", "Comments");
		String chefId = userId(chefToken);
		String memberId = userId(memberToken);

		String projectId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects")
						.header("Authorization", "Bearer " + bureauToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Comments board",
								  "chefUserId": "%s"
								}
								""".formatted(chefId)))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(putMembers(projectId, chefToken, chefId, memberId))
				.andExpect(status().isOk());

		String taskId = JsonPath.read(
				mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
						.header("Authorization", "Bearer " + chefToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "title": "Discuss" }
								"""))
						.andExpect(status().isCreated())
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		String commentId = JsonPath.read(
				mockMvc.perform(post("/api/v1/tasks/" + taskId + "/comments")
						.header("Authorization", "Bearer " + memberToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "body": "Premier avis" }
								"""))
						.andExpect(status().isCreated())
						.andExpect(jsonPath("$.body").value("Premier avis"))
						.andExpect(jsonPath("$.authorId").value(memberId))
						.andReturn()
						.getResponse()
						.getContentAsString(),
				"$.id");

		mockMvc.perform(get("/api/v1/tasks/" + taskId + "/comments")
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].body").value("Premier avis"));

		mockMvc.perform(get("/api/v1/tasks/" + taskId + "/comments")
				.header("Authorization", "Bearer " + outsiderToken))
				.andExpect(status().isNotFound());

		mockMvc.perform(post("/api/v1/tasks/" + taskId + "/comments")
				.header("Authorization", "Bearer " + outsiderToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "body": "Intrus" }
						"""))
				.andExpect(status().isNotFound());

		mockMvc.perform(patch("/api/v1/comments/" + commentId)
				.header("Authorization", "Bearer " + chefToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "body": "Hack" }
						"""))
				.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/v1/comments/" + commentId)
				.header("Authorization", "Bearer " + memberToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "body": "Avis mis à jour" }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.body").value("Avis mis à jour"));

		mockMvc.perform(delete("/api/v1/comments/" + commentId)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/tasks/" + taskId + "/comments")
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));
	}

	private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder putMembers(
			String projectId,
			String token,
			String chefId,
			String memberId) {
		return org.springframework.test.web.servlet.request.MockMvcRequestBuilders
				.put("/api/v1/projects/" + projectId + "/members")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "members": [
						    { "userId": "%s", "role": "CHEF_PROJET" },
						    { "userId": "%s", "role": "CONTRIBUTEUR" }
						  ]
						}
						""".formatted(chefId, memberId));
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
