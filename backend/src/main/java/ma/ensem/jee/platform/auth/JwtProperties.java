package ma.ensem.jee.platform.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

	/** HS256 key — override with JWT_SECRET in production (min 32 chars). */
	private String secret = "jee-ensem-dev-secret-change-me-32chars-min";

	private long accessTokenMinutes = 15;

	private long refreshTokenDays = 7;

	private boolean cookieSecure = false;

	public String getSecret() {
		return secret;
	}

	public void setSecret(String secret) {
		this.secret = secret;
	}

	public long getAccessTokenMinutes() {
		return accessTokenMinutes;
	}

	public void setAccessTokenMinutes(long accessTokenMinutes) {
		this.accessTokenMinutes = accessTokenMinutes;
	}

	public long getRefreshTokenDays() {
		return refreshTokenDays;
	}

	public void setRefreshTokenDays(long refreshTokenDays) {
		this.refreshTokenDays = refreshTokenDays;
	}

	public boolean isCookieSecure() {
		return cookieSecure;
	}

	public void setCookieSecure(boolean cookieSecure) {
		this.cookieSecure = cookieSecure;
	}
}
