package ma.ensem.jee.platform.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.core.env.Environment;

import ma.ensem.jee.platform.auth.JwtProperties;
import ma.ensem.jee.platform.auth.RegistrationProperties;

class ProductionSafetyValidatorTest {

	private Environment environment;
	private JwtProperties jwtProperties;
	private RegistrationProperties registrationProperties;
	private ProductionSafetyValidator validator;

	@BeforeEach
	void setUp() {
		environment = mock(Environment.class);
		jwtProperties = new JwtProperties();
		registrationProperties = new RegistrationProperties();
		registrationProperties.setAllowedEmailDomains("ensem.ac.ma,ensem.jee");
		registrationProperties.setRequireApproval(true);
		when(environment.getActiveProfiles()).thenReturn(new String[] {});
		when(environment.getProperty("spring.datasource.driver-class-name", "")).thenReturn("org.h2.Driver");
		when(environment.getProperty("spring.h2.console.enabled", Boolean.class, false)).thenReturn(false);
		when(environment.getProperty("app.seed.enabled", Boolean.class, false)).thenReturn(false);
		validator = new ProductionSafetyValidator(environment, jwtProperties, registrationProperties);
	}

	@Test
	void localAllowsDefaultJwtSecret() {
		jwtProperties.setSecret(JwtProperties.DEV_DEFAULT_SECRET);
		jwtProperties.setCookieSecure(false);
		registrationProperties.setRequireApproval(false);

		assertThatCode(() -> validator.run(new DefaultApplicationArguments()))
				.doesNotThrowAnyException();
	}

	@Test
	void prodProfileRejectsDefaultSecret() {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "prod" });
		jwtProperties.setSecret(JwtProperties.DEV_DEFAULT_SECRET);

		assertThatThrownBy(() -> validator.run(new DefaultApplicationArguments()))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("default development JWT secret");
	}

	@Test
	void cookieSecureRejectsMissingSecret() {
		jwtProperties.setCookieSecure(true);
		jwtProperties.setSecret("   ");

		assertThatThrownBy(() -> validator.run(new DefaultApplicationArguments()))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("JWT_SECRET is required");
	}

	@Test
	void postgresDriverRejectsShortSecret() {
		when(environment.getProperty("spring.datasource.driver-class-name", ""))
				.thenReturn("org.postgresql.Driver");
		jwtProperties.setSecret("too-short-secret");

		assertThatThrownBy(() -> validator.run(new DefaultApplicationArguments()))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("at least 32 characters");
	}

	@Test
	void prodRejectsEnabledH2Console() {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "prod" });
		when(environment.getProperty("spring.h2.console.enabled", Boolean.class, false)).thenReturn(true);
		jwtProperties.setSecret("a-very-long-production-secret-key-32+");

		assertThatThrownBy(() -> validator.run(new DefaultApplicationArguments()))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("H2 console must be disabled");
	}

	@Test
	void prodRejectsSeedEnabled() {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "prod" });
		when(environment.getProperty("app.seed.enabled", Boolean.class, false)).thenReturn(true);
		jwtProperties.setSecret("a-very-long-production-secret-key-32+");

		assertThatThrownBy(() -> validator.run(new DefaultApplicationArguments()))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("SEED_ENABLED");
	}

	@Test
	void prodRejectsEmptyRegistrationDomains() {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "prod" });
		jwtProperties.setSecret("a-very-long-production-secret-key-32+");
		registrationProperties.setAllowedEmailDomains("  ");

		assertThatThrownBy(() -> validator.run(new DefaultApplicationArguments()))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("REGISTRATION_ALLOWED_DOMAINS");
	}

	@Test
	void prodRejectsOpenRegistrationWithoutApproval() {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "prod" });
		jwtProperties.setSecret("a-very-long-production-secret-key-32+");
		registrationProperties.setRequireApproval(false);

		assertThatThrownBy(() -> validator.run(new DefaultApplicationArguments()))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("REGISTRATION_REQUIRE_APPROVAL");
	}

	@Test
	void prodAcceptsStrongSecretWithConsoleOff() {
		when(environment.getActiveProfiles()).thenReturn(new String[] { "prod" });
		jwtProperties.setSecret("a-very-long-production-secret-key-32+");
		jwtProperties.setCookieSecure(true);

		assertThatCode(() -> validator.run(new DefaultApplicationArguments()))
				.doesNotThrowAnyException();
	}
}
