package ma.ensem.jee.platform.recruitment.dto;

import java.time.Instant;
import java.util.UUID;

import ma.ensem.jee.platform.recruitment.RecruitmentStage;
import ma.ensem.jee.platform.user.MembershipStatus;

public record RecruitmentEntryResponse(
		UUID id,
		UUID userId,
		String email,
		String firstName,
		String lastName,
		MembershipStatus membershipStatus,
		UUID poleId,
		String poleName,
		RecruitmentStage stage,
		String notes,
		Instant interviewAt,
		Instant decidedAt,
		Instant createdAt,
		Instant updatedAt) {
}
