package ma.ensem.jee.platform.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Cookie;

@SpringBootTest
class AuthControllerTest {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private ma.ensem.jee.platform.mail.LoggingMailService loggingMailService;

	private MockMvc mockMvc;

	@PostConstruct
	void setUp() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(
				org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
	}

	private static MockHttpServletRequestBuilder cookieAuthPost(String path, String refreshCookie) {
		return post(path)
				.header(AuthCookieCsrfFilter.CSRF_HEADER, AuthCookieCsrfFilter.CSRF_HEADER_VALUE)
				.cookie(new Cookie(AuthService.REFRESH_COOKIE, refreshCookie));
	}

	@Test
	void healthIsPublic() throws Exception {
		mockMvc.perform(get("/api/v1/health"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("UP"))
				.andExpect(jsonPath("$.db").value("UP"))
				.andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
				.andExpect(header().string("X-Frame-Options", "DENY"));
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
				.andExpect(jsonPath("$.pendingApproval").value(false))
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

		MvcResult refreshed = mockMvc.perform(cookieAuthPost("/api/v1/auth/refresh", refreshCookie))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andReturn();

		String rotatedCookie = refreshed.getResponse().getCookie(AuthService.REFRESH_COOKIE).getValue();
		org.assertj.core.api.Assertions.assertThat(rotatedCookie).isNotEqualTo(refreshCookie);

		// Previous refresh token is revoked after rotation
		mockMvc.perform(cookieAuthPost("/api/v1/auth/refresh", refreshCookie))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(cookieAuthPost("/api/v1/auth/logout", rotatedCookie))
				.andExpect(status().isNoContent());

		// Logout revokes the current refresh token
		mockMvc.perform(cookieAuthPost("/api/v1/auth/refresh", rotatedCookie))
				.andExpect(status().isUnauthorized());

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

	@Test
	void refreshAndLogoutRequireCsrfHeader() throws Exception {
		String email = "csrf.test@ensem.jee";
		String password = "Password123!";

		MvcResult register = mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s",
						  "firstName": "Csrf",
						  "lastName": "Guard"
						}
						""".formatted(email, password)))
				.andExpect(status().isCreated())
				.andReturn();

		String refreshCookie = register.getResponse().getCookie(AuthService.REFRESH_COOKIE).getValue();

		mockMvc.perform(post("/api/v1/auth/refresh")
				.cookie(new Cookie(AuthService.REFRESH_COOKIE, refreshCookie)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Requête refusée (protection CSRF). Recharge la page."));

		mockMvc.perform(post("/api/v1/auth/logout")
				.cookie(new Cookie(AuthService.REFRESH_COOKIE, refreshCookie)))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/v1/auth/refresh")
				.header(AuthCookieCsrfFilter.CSRF_HEADER, AuthCookieCsrfFilter.CSRF_HEADER_VALUE)
				.header("Origin", "https://evil.example")
				.cookie(new Cookie(AuthService.REFRESH_COOKIE, refreshCookie)))
				.andExpect(status().isForbidden());

		mockMvc.perform(cookieAuthPost("/api/v1/auth/refresh", refreshCookie)
				.header("Origin", "http://localhost:3000"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty());
	}

	@Test
	void forgotAndResetPasswordFlow() throws Exception {
		String email = "reset.test@ensem.jee";
		String oldPassword = "Password123!";
		String newPassword = "NewPassword456!";

		MvcResult register = mockMvc.perform(post("/api/v1/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s",
						  "firstName": "Rania",
						  "lastName": "Reset"
						}
						""".formatted(email, oldPassword)))
				.andExpect(status().isCreated())
				.andReturn();

		String refreshCookie = register.getResponse().getCookie(AuthService.REFRESH_COOKIE).getValue();

		mockMvc.perform(post("/api/v1/auth/forgot-password")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "%s" }
						""".formatted(email)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").isNotEmpty());

		// Unknown email still returns 200 (anti-enumeration)
		mockMvc.perform(post("/api/v1/auth/forgot-password")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{ "email": "nobody@ensem.jee" }
						"""))
				.andExpect(status().isOk());

		String resetUrl = loggingMailService.getLastResetUrl();
		org.assertj.core.api.Assertions.assertThat(resetUrl).contains("token=");
		String token = resetUrl.substring(resetUrl.indexOf("token=") + "token=".length());

		mockMvc.perform(post("/api/v1/auth/reset-password")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "token": "%s",
						  "password": "%s"
						}
						""".formatted(token, newPassword)))
				.andExpect(status().isOk());

		// Reset password revokes all refresh sessions
		mockMvc.perform(cookieAuthPost("/api/v1/auth/refresh", refreshCookie))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s"
						}
						""".formatted(email, oldPassword)))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "email": "%s",
						  "password": "%s"
						}
						""".formatted(email, newPassword)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty());

		mockMvc.perform(post("/api/v1/auth/reset-password")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "token": "%s",
						  "password": "AnotherPass789!"
						}
						""".formatted(token)))
				.andExpect(status().isUnauthorized());
	}
}
