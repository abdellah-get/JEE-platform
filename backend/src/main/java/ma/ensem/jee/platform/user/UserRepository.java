package ma.ensem.jee.platform.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	List<User> findByActiveTrueOrderByLastNameAscFirstNameAsc();

	List<User> findByActiveTrueAndEmailDigestEnabledTrue();

	List<User> findAllByOrderByLastNameAscFirstNameAsc();

	Page<User> findAllByOrderByLastNameAscFirstNameAsc(Pageable pageable);

	Page<User> findByMembershipStatusOrderByLastNameAscFirstNameAsc(MembershipStatus membershipStatus, Pageable pageable);

	long countByClubRoleAndActiveTrue(ClubRole clubRole);
}
