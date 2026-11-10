package ma.ensem.jee.platform.recruitment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PoleRepository extends JpaRepository<Pole, UUID> {

	List<Pole> findAllByOrderByNameAsc();

	List<Pole> findByActiveTrueOrderByNameAsc();

	Optional<Pole> findByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCase(String name);
}
