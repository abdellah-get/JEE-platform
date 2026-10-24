package ma.ensem.jee.platform.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import ma.ensem.jee.platform.user.User;

@Service
public class JwtService {

	public static final String CLAIM_TYPE = "type";
	public static final String CLAIM_ROLE = "role";
	public static final String TYPE_ACCESS = "access";
	public static final String TYPE_REFRESH = "refresh";

	private final JwtProperties properties;
	private final SecretKey key;

	public JwtService(JwtProperties properties) {
		this.properties = properties;
		this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
	}

	public String createAccessToken(User user) {
		Instant now = Instant.now();
		Instant exp = now.plusSeconds(properties.getAccessTokenMinutes() * 60);
		return Jwts.builder()
				.subject(user.getId().toString())
				.claim(CLAIM_TYPE, TYPE_ACCESS)
				.claim(CLAIM_ROLE, user.getClubRole().name())
				.claim("email", user.getEmail())
				.issuedAt(Date.from(now))
				.expiration(Date.from(exp))
				.signWith(key)
				.compact();
	}

	public String createRefreshToken(User user) {
		Instant now = Instant.now();
		Instant exp = now.plusSeconds(properties.getRefreshTokenDays() * 24 * 60 * 60);
		return Jwts.builder()
				.subject(user.getId().toString())
				.claim(CLAIM_TYPE, TYPE_REFRESH)
				.issuedAt(Date.from(now))
				.expiration(Date.from(exp))
				.signWith(key)
				.compact();
	}

	public Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public UUID getUserId(Claims claims) {
		return UUID.fromString(claims.getSubject());
	}

	public boolean isAccessToken(Claims claims) {
		return TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class));
	}

	public boolean isRefreshToken(Claims claims) {
		return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
	}

	public long getAccessTokenMinutes() {
		return properties.getAccessTokenMinutes();
	}

	public long getRefreshTokenDays() {
		return properties.getRefreshTokenDays();
	}

	public boolean isCookieSecure() {
		return properties.isCookieSecure();
	}
}
