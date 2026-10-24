package ma.ensem.jee.platform.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.password-reset")
public class PasswordResetProperties {

	/** Token lifetime in minutes. */
	private long ttlMinutes = 60;

	/** Frontend origin used to build the reset link. */
	private String frontendBaseUrl = "http://localhost:3000";

	public long getTtlMinutes() {
		return ttlMinutes;
	}

	public void setTtlMinutes(long ttlMinutes) {
		this.ttlMinutes = ttlMinutes;
	}

	public String getFrontendBaseUrl() {
		return frontendBaseUrl;
	}

	public void setFrontendBaseUrl(String frontendBaseUrl) {
		this.frontendBaseUrl = frontendBaseUrl;
	}
}
