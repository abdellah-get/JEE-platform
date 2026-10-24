package ma.ensem.jee.platform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import ma.ensem.jee.platform.auth.JwtProperties;

/**
 * Fails fast in production-like environments when JWT is misconfigured,
 * and keeps the H2 console out of non-local deployments.
 */
@Component
@Order(0)
public class ProductionSafetyValidator implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ProductionSafetyValidator.class);

	private final Environment environment;
	private final JwtProperties jwtProperties;

	public ProductionSafetyValidator(Environment environment, JwtProperties jwtProperties) {
		this.environment = environment;
		this.jwtProperties = jwtProperties;
	}

	@Override
	public void run(ApplicationArguments args) {
		boolean prodLike = isProductionLike();
		String secret = jwtProperties.getSecret();

		if (prodLike) {
			if (secret == null || secret.isBlank()) {
				throw new IllegalStateException(
						"JWT_SECRET is required in production. Set a random secret of at least 32 characters.");
			}
			if (JwtProperties.DEV_DEFAULT_SECRET.equals(secret)) {
				throw new IllegalStateException(
						"Refusing to start with the default development JWT secret. "
								+ "Set JWT_SECRET (min 32 chars) and SPRING_PROFILES_ACTIVE=prod.");
			}
			if (secret.length() < 32) {
				throw new IllegalStateException(
						"JWT_SECRET must be at least 32 characters in production (was " + secret.length() + ").");
			}
			if (isH2ConsoleEnabled()) {
				throw new IllegalStateException(
						"H2 console must be disabled in production (spring.h2.console.enabled=false).");
			}
			log.info("Production safety checks passed (JWT secret + H2 console).");
		}
		else if (isH2ConsoleEnabled()) {
			log.info("H2 console enabled (local/dev). URL path: /h2-console");
		}
	}

	boolean isProductionLike() {
		for (String profile : environment.getActiveProfiles()) {
			if ("prod".equalsIgnoreCase(profile)) {
				return true;
			}
		}
		if (jwtProperties.isCookieSecure()) {
			return true;
		}
		String driver = environment.getProperty("spring.datasource.driver-class-name", "");
		return driver.toLowerCase().contains("postgresql");
	}

	private boolean isH2ConsoleEnabled() {
		return environment.getProperty("spring.h2.console.enabled", Boolean.class, false);
	}
}
