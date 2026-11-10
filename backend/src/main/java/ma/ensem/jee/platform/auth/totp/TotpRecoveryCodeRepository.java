package ma.ensem.jee.platform.auth.totp;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TotpRecoveryCodeRepository extends JpaRepository<TotpRecoveryCode, UUID> {

	List<TotpRecoveryCode> findByUserIdAndUsedAtIsNull(UUID userId);

	void deleteByUserId(UUID userId);

	long countByUserIdAndUsedAtIsNull(UUID userId);
}
