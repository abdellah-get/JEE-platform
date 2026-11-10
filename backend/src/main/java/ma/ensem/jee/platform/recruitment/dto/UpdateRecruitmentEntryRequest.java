package ma.ensem.jee.platform.recruitment.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Size;
import ma.ensem.jee.platform.recruitment.RecruitmentStage;

public record UpdateRecruitmentEntryRequest(
		RecruitmentStage stage,
		UUID poleId,
		Boolean clearPole,
		@Size(max = 10000) String notes,
		Instant interviewAt) {
}
