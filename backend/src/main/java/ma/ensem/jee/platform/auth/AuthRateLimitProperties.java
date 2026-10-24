package ma.ensem.jee.platform.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth.rate-limit")
public class AuthRateLimitProperties {

	private boolean enabled = true;

	/** Max requests per client IP per endpoint within the window. */
	private int maxRequests = 20;

	private int windowSeconds = 60;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public int getMaxRequests() {
		return maxRequests;
	}

	public void setMaxRequests(int maxRequests) {
		this.maxRequests = maxRequests;
	}

	public int getWindowSeconds() {
		return windowSeconds;
	}

	public void setWindowSeconds(int windowSeconds) {
		this.windowSeconds = windowSeconds;
	}
}
