package ma.ensem.jee.platform.attachment;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@SpringBootTest
class AttachmentControllerTest {

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
	void memberCanUploadListDownloadAndOwnerCanDelete() throws Exception {
		String bureauToken = registerAndPromote("bureau.att@ensem.jee", ClubRole.BUREAU);
		String chefToken = register("chef.att@ensem.jee", "Chef", "Att");
		String outsiderToken = register("outsider.att@ensem.jee", "Out", "Sider");

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
						  "name": "Livrables JE",
						  "status": "ACTIF",
						  "chefUserId": "%s"
						}
						""".formatted(chefUserId)))
				.andExpect(status().isCreated())
				.andReturn();
		String projectId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

		MockMultipartFile file = new MockMultipartFile(
				"file",
				"pv-ag.pdf",
				"application/pdf",
				"contenu-pv".getBytes());

		MvcResult uploaded = mockMvc.perform(multipart("/api/v1/projects/" + projectId + "/attachments")
				.file(file)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.originalName").value("pv-ag.pdf"))
				.andExpect(jsonPath("$.contentType").value("application/pdf"))
				.andReturn();
		String attachmentId = JsonPath.read(uploaded.getResponse().getContentAsString(), "$.id");

		mockMvc.perform(get("/api/v1/projects/" + projectId + "/attachments")
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1));

		mockMvc.perform(get("/api/v1/projects/" + projectId + "/attachments/" + attachmentId + "/download")
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("pv-ag.pdf")));

		mockMvc.perform(get("/api/v1/projects/" + projectId + "/attachments")
				.header("Authorization", "Bearer " + outsiderToken))
				.andExpect(status().isNotFound());

		MockMultipartFile badType = new MockMultipartFile(
				"file",
				"hack.exe",
				"application/x-msdownload",
				"x".getBytes());
		mockMvc.perform(multipart("/api/v1/projects/" + projectId + "/attachments")
				.file(badType)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isBadRequest());

		mockMvc.perform(delete("/api/v1/projects/" + projectId + "/attachments/" + attachmentId)
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/v1/projects/" + projectId + "/attachments")
				.header("Authorization", "Bearer " + chefToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));
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
