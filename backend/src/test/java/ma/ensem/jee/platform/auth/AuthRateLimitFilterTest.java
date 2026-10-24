package ma.ensem.jee.platform.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@TestPropertySource(properties = {
		"app.auth.rate-limit.enabled=true",
		"app.auth.rate-limit.max-requests=3",
		"app.auth.rate-limit.window-seconds=60"
})
class AuthRateLimitFilterTest {

	@Autowired
	private WebApplicationContext context;

	@Autowired
	private AuthRateLimiter rateLimiter;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		rateLimiter.reset();
		this.mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(
				org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
	}

	@Test
	void loginReturns429AfterExceedingLimit() throws Exception {
		String body = """
				{ "email": "nobody@ensem.jee", "password": "wrong-password" }
				""";

		for (int i = 0; i < 3; i++) {
			mockMvc.perform(post("/api/v1/auth/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content(body)
					.with(request -> {
						request.setRemoteAddr("203.0.113.10");
						return request;
					}))
					.andExpect(status().isUnauthorized());
		}

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(body)
				.with(request -> {
					request.setRemoteAddr("203.0.113.10");
					return request;
				}))
				.andExpect(status().isTooManyRequests())
				.andExpect(header().string("Retry-After", "60"))
				.andExpect(jsonPath("$.error").value("Trop de tentatives. Réessaie dans quelques instants."));
	}

	@Test
	void differentIpsAreTrackedSeparately() throws Exception {
		String body = """
				{ "email": "nobody@ensem.jee", "password": "wrong-password" }
				""";

		for (int i = 0; i < 3; i++) {
			mockMvc.perform(post("/api/v1/auth/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content(body)
					.with(request -> {
						request.setRemoteAddr("203.0.113.20");
						return request;
					}))
					.andExpect(status().isUnauthorized());
		}

		mockMvc.perform(post("/api/v1/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(body)
				.with(request -> {
					request.setRemoteAddr("203.0.113.21");
					return request;
				}))
				.andExpect(status().isUnauthorized());
	}
}
