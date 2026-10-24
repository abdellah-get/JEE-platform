package ma.ensem.jee.platform.user;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class UserRepositoryTest {

	@Autowired
	private UserRepository userRepository;

	@Test
	void flywayCreatesUsersTableAndRepositoryWorks() {
		User user = new User(
				"membre@ensem.jee",
				"{noop}not-a-real-hash-yet",
				"Amina",
				"Benali",
				ClubRole.MEMBRE);

		User saved = userRepository.save(user);

		assertThat(saved.getId()).isNotNull();
		assertThat(userRepository.findByEmailIgnoreCase("MEMBRE@ensem.jee")).isPresent();
		assertThat(userRepository.existsByEmailIgnoreCase("membre@ensem.jee")).isTrue();
	}
}
