package ma.ensem.jee.platform.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AuthRateLimiterTest {

	private AuthRateLimiter limiter;

	@BeforeEach
	void setUp() {
		limiter = new AuthRateLimiter();
	}

	@Test
	void allowsUpToMaxThenRejects() {
		assertThat(limiter.tryAcquire("k", 2, 60)).isTrue();
		assertThat(limiter.tryAcquire("k", 2, 60)).isTrue();
		assertThat(limiter.tryAcquire("k", 2, 60)).isFalse();
	}

	@Test
	void keysAreIndependent() {
		assertThat(limiter.tryAcquire("a", 1, 60)).isTrue();
		assertThat(limiter.tryAcquire("b", 1, 60)).isTrue();
		assertThat(limiter.tryAcquire("a", 1, 60)).isFalse();
	}
}
