package ma.ensem.jee.platform.auth;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.registration")
public class RegistrationProperties {

	/**
	 * Comma-separated email domains allowed to self-register (e.g. {@code ensem.ac.ma,ensem.jee}).
	 * Empty = no domain restriction.
	 */
	private String allowedEmailDomains = "ensem.ac.ma,ensem.jee";

	/**
	 * When true, new accounts are created inactive until a bureau/admin activates them.
	 */
	private boolean requireApproval = false;

	public String getAllowedEmailDomains() {
		return allowedEmailDomains;
	}

	public void setAllowedEmailDomains(String allowedEmailDomains) {
		this.allowedEmailDomains = allowedEmailDomains;
	}

	public boolean isRequireApproval() {
		return requireApproval;
	}

	public void setRequireApproval(boolean requireApproval) {
		this.requireApproval = requireApproval;
	}

	public List<String> allowedDomainList() {
		if (allowedEmailDomains == null || allowedEmailDomains.isBlank()) {
			return List.of();
		}
		return Arrays.stream(allowedEmailDomains.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.map(s -> s.toLowerCase(Locale.ROOT).replaceFirst("^@", ""))
				.toList();
	}

	public boolean isEmailAllowed(String email) {
		List<String> domains = allowedDomainList();
		if (domains.isEmpty()) {
			return true;
		}
		if (email == null || !email.contains("@")) {
			return false;
		}
		String domain = email.substring(email.lastIndexOf('@') + 1).trim().toLowerCase(Locale.ROOT);
		return domains.contains(domain);
	}
}
