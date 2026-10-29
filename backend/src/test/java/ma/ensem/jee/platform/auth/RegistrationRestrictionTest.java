package ma.ensem.jee.platform.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;
import ma.ensem.jee.platform.user.UserRepository;

@SpringBootTest
@TestPropertySource(properties = {
		"app.registration.allowed-email-domains=ensem.ac.ma,ensem.jee",
		"app.registration.require-approval=true"
})
class RegistrationRestrictionTest {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(
				org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
	}

	@Test
	void rejectsDisallowedEmailDomain() throws Exception {
		mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "intrus@gmail.com",
						  "password": "Password123!",
						  "firstName": "Intrus",
						  "lastName": "Externe"
						}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(Matchers.containsString("domaines autorisés")));
	}

	@Test
	void pendingApprovalUntilBureauActivates() throws Exception {
		String memberEmail = "to.activate@ensem.jee";
		String memberPassword = "Password123!";
		String bureauEmail = "bureau.activate@ensem.jee";
		String bureauPassword = "Password123!";

		mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s",
						  "firstName": "To",
						  "lastName": "Activate"
						}
						""".formatted(memberEmail, memberPassword)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.pendingApproval").value(true))
				.andExpect(jsonPath("$.message").value(Matchers.containsString("bureau")))
				.andExpect(jsonPath("$.accessToken").value(Matchers.nullValue()));

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "%s" }
						""".formatted(memberEmail, memberPassword)))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value(Matchers.containsString("attente")));

		User bureau = new User(
				bureauEmail,
				passwordEncoder.encode(bureauPassword),
				"Bureau",
				"Activate",
				ClubRole.BUREAU);
		bureau.setActive(true);
		userRepository.save(bureau);

		MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "%s" }
						""".formatted(bureauEmail, bureauPassword)))
				.andExpect(status().isOk())
				.andReturn();
		String access = JsonPath.read(login.getResponse().getContentAsString(), "$.accessToken");

		User pending = userRepository.findByEmailIgnoreCase(memberEmail).orElseThrow();
		mockMvc.perform(patch("/api/v1/admin/users/" + pending.getId() + "/active")
				.header("Authorization", "Bearer " + access)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "active": true }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.active").value(true))
				.andExpect(jsonPath("$.membershipStatus").value("APPROVED"));

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "%s" }
						""".formatted(memberEmail, memberPassword)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty());
	}

	@Test
	void rejectedMembershipBlocksLogin() throws Exception {
		String memberEmail = "to.reject." + UUID.randomUUID() + "@ensem.jee";
		String memberPassword = "Password123!";
		String bureauEmail = "bureau.reject." + UUID.randomUUID() + "@ensem.jee";
		String bureauPassword = "Password123!";

		mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s",
						  "firstName": "To",
						  "lastName": "Reject"
						}
						""".formatted(memberEmail, memberPassword)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.pendingApproval").value(true));

		User bureau = new User(
				bureauEmail,
				passwordEncoder.encode(bureauPassword),
				"Bureau",
				"Reject",
				ClubRole.BUREAU);
		bureau.setActive(true);
		userRepository.save(bureau);

		MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "%s" }
						""".formatted(bureauEmail, bureauPassword)))
				.andExpect(status().isOk())
				.andReturn();
		String access = JsonPath.read(login.getResponse().getContentAsString(), "$.accessToken");

		User pending = userRepository.findByEmailIgnoreCase(memberEmail).orElseThrow();
		mockMvc.perform(patch("/api/v1/admin/users/" + pending.getId() + "/membership")
				.header("Authorization", "Bearer " + access)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "decision": "REJECT" }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.membershipStatus").value("REJECTED"))
				.andExpect(jsonPath("$.active").value(false));

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s", "password": "%s" }
						""".formatted(memberEmail, memberPassword)))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value(Matchers.containsString("refus")));
	}
}
