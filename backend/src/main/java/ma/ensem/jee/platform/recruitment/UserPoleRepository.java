package ma.ensem.jee.platform.recruitment;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPoleRepository extends JpaRepository<UserPole, UserPoleId> {

	List<UserPole> findByUserId(UUID userId);

	List<UserPole> findByPoleId(UUID poleId);

	void deleteByUserIdAndPoleId(UUID userId, UUID poleId);

	boolean existsByUserIdAndPoleId(UUID userId, UUID poleId);
}
