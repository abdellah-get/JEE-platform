package ma.ensem.jee.platform.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

import jakarta.annotation.PostConstruct;

@SpringBootTest
class AuthControllerTest {

	@Autowired
	private WebApplicationContext context;

	private MockMvc mockMvc;

	@PostConstruct
	void setUp() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(
				org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
	}

	@Test
	void healthIsPublic() throws Exception {
		mockMvc.perform(get("/api/v1/health"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("UP"));
	}

	@Test
	void registerLoginRefreshAndProtectedFlow() throws Exception {
		String email = "auth.test@ensem.jee";
		String password = "Password123!";

		mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s",
						  "firstName": "Sara",
						  "lastName": "Alaoui"
						}
						""".formatted(email, password)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andExpect(jsonPath("$.clubRole").value("MEMBRE"));

		MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s"
						}
						""".formatted(email, password)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andReturn();

		String accessToken = JsonPath.read(login.getResponse().getContentAsString(), "$.accessToken");
		String refreshCookie = login.getResponse().getCookie(AuthService.REFRESH_COOKIE).getValue();

		mockMvc.perform(get("/api/v1/health")
				.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/auth/refresh")
				.cookie(new jakarta.servlet.http.Cookie(AuthService.REFRESH_COOKIE, refreshCookie)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty());

		mockMvc.perform(post("/api/v1/auth/logout"))
				.andExpect(status().isNoContent());

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "wrong-password"
						}
						""".formatted(email)))
				.andExpect(status().isUnauthorized());
	}
}
