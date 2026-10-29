-- V13: membership approval. Existing accounts stay APPROVED.
ALTER TABLE users ADD COLUMN membership_status VARCHAR(16) NOT NULL DEFAULT 'APPROVED';

ALTER TABLE users ADD CONSTRAINT ck_users_membership_status
    CHECK (membership_status IN ('PENDING', 'APPROVED', 'REJECTED'));
