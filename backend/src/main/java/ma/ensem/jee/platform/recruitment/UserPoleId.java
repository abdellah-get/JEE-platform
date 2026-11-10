package ma.ensem.jee.platform.recruitment;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class UserPoleId implements Serializable {

	private UUID userId;
	private UUID poleId;

	public UserPoleId() {
	}

	public UserPoleId(UUID userId, UUID poleId) {
		this.userId = userId;
		this.poleId = poleId;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) {
			return true;
		}
		if (!(o instanceof UserPoleId that)) {
			return false;
		}
		return Objects.equals(userId, that.userId) && Objects.equals(poleId, that.poleId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(userId, poleId);
	}
}
