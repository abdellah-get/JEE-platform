package ma.ensem.jee.platform.auth;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties({
		JwtProperties.class,
		CorsProperties.class,
		PasswordResetProperties.class,
		AuthRateLimitProperties.class,
		RegistrationProperties.class,
		ma.ensem.jee.platform.attachment.AttachmentProperties.class
})
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final AuthRateLimitFilter authRateLimitFilter;
	private final AuthCookieCsrfFilter authCookieCsrfFilter;
	private final CorsProperties corsProperties;
	private final JwtProperties jwtProperties;
	private final boolean h2ConsoleEnabled;

	public SecurityConfig(
			JwtAuthenticationFilter jwtAuthenticationFilter,
			AuthRateLimitFilter authRateLimitFilter,
			AuthCookieCsrfFilter authCookieCsrfFilter,
			CorsProperties corsProperties,
			JwtProperties jwtProperties,
			@Value("${spring.h2.console.enabled:false}") boolean h2ConsoleEnabled) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
		this.authRateLimitFilter = authRateLimitFilter;
		this.authCookieCsrfFilter = authCookieCsrfFilter;
		this.corsProperties = corsProperties;
		this.jwtProperties = jwtProperties;
		this.h2ConsoleEnabled = h2ConsoleEnabled;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)
				.cors(Customizer.withDefaults())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(ex -> ex.authenticationEntryPoint(jsonUnauthorizedEntryPoint()))
				.authorizeHttpRequests(auth -> {
					auth.requestMatchers("/api/v1/health").permitAll()
							.requestMatchers("/api/v1/auth/**").permitAll()
							.requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
							.requestMatchers("/actuator/**").authenticated()
							.requestMatchers(
									"/v3/api-docs",
									"/v3/api-docs/**",
									"/swagger-ui.html",
									"/swagger-ui/**")
							.authenticated()
							.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
					if (h2ConsoleEnabled) {
						auth.requestMatchers("/h2-console/**").permitAll();
					}
					auth.anyRequest().authenticated();
				})
				.headers(headers -> {
					headers.contentTypeOptions(Customizer.withDefaults());
					headers.referrerPolicy(policy -> policy.policy(
							ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
					if (h2ConsoleEnabled) {
						headers.frameOptions(frame -> frame.sameOrigin());
					}
					else {
						headers.frameOptions(frame -> frame.deny());
					}
					if (jwtProperties.isCookieSecure()) {
						headers.httpStrictTransportSecurity(hsts -> hsts
								.includeSubDomains(true)
								.maxAgeInSeconds(31_536_000));
					}
					else {
						headers.httpStrictTransportSecurity(hsts -> hsts.disable());
					}
				})
				.addFilterBefore(authCookieCsrfFilter, UsernamePasswordAuthenticationFilter.class)
				.addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	/** Unauthenticated API calls → 401 JSON (not bare 403), so the front can refresh or redirect to login. */
	private static AuthenticationEntryPoint jsonUnauthorizedEntryPoint() {
		return (request, response, authException) -> {
			response.setStatus(401);
			response.setCharacterEncoding(StandardCharsets.UTF_8.name());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"error\":\"Session expirée. Reconnecte-toi.\"}");
		};
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder(12);
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(corsProperties.allowedOriginList());
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}
}
