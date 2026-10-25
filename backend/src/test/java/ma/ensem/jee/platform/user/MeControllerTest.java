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
class MeControllerTest {

	@Autowired
	private WebApplicationContext context;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(context)
				.apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	@Test
	void meRequiresAuthAndAllowsUpdateAndPasswordChange() throws Exception {
		mockMvc.perform(get("/api/v1/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Session expirée. Reconnecte-toi."));

		String email = "me.test@ensem.jee";
		String password = "Password123!";

		MvcResult register = mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s",
						  "firstName": "Yassine",
						  "lastName": "Idrissi"
						}
						""".formatted(email, password)))
				.andExpect(status().isCreated())
				.andReturn();

		String token = JsonPath.read(register.getResponse().getContentAsString(), "$.accessToken");
		String refreshCookie = register.getResponse()
				.getCookie(ma.ensem.jee.platform.auth.AuthService.REFRESH_COOKIE)
				.getValue();

		mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value(email))
				.andExpect(jsonPath("$.firstName").value("Yassine"));

		mockMvc.perform(patch("/api/v1/me")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "firstName": "Yass", "lastName": "Idrissi" }
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.firstName").value("Yass"));

		mockMvc.perform(post("/api/v1/me/password")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "currentPassword": "%s",
						  "newPassword": "NewPassword123!"
						}
						""".formatted(password)))
				.andExpect(status().isNoContent());

		// Change password revokes all refresh sessions
		mockMvc.perform(post("/api/v1/auth/refresh")
				.header(
						ma.ensem.jee.platform.auth.AuthCookieCsrfFilter.CSRF_HEADER,
						ma.ensem.jee.platform.auth.AuthCookieCsrfFilter.CSRF_HEADER_VALUE)
				.cookie(new jakarta.servlet.http.Cookie(
						ma.ensem.jee.platform.auth.AuthService.REFRESH_COOKIE, refreshCookie)))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "NewPassword123!"
						}
						""".formatted(email)))
				.andExpect(status().isOk());
	}
}
