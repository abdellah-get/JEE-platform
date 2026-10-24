package ma.ensem.jee.platform.auth;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import ma.ensem.jee.platform.user.ClubRole;
import ma.ensem.jee.platform.user.User;

public class UserPrincipal implements UserDetails {

	private final UUID id;
	private final String email;
	private final String passwordHash;
	private final ClubRole clubRole;
	private final boolean active;

	public UserPrincipal(User user) {
		this.id = user.getId();
		this.email = user.getEmail();
		this.passwordHash = user.getPasswordHash();
		this.clubRole = user.getClubRole();
		this.active = user.isActive();
	}

	public UUID getId() {
		return id;
	}

	public ClubRole getClubRole() {
		return clubRole;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + clubRole.name()));
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return active;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return active;
	}
}
