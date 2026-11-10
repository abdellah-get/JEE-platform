-- V19: TOTP 2FA optionnel + recovery codes

ALTER TABLE users ADD COLUMN totp_secret VARCHAR(64);
ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN totp_confirmed_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE totp_recovery_codes (
    id              UUID                        NOT NULL PRIMARY KEY,
    user_id         UUID                        NOT NULL,
    code_hash       VARCHAR(64)                 NOT NULL,
    used_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_totp_recovery_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_totp_recovery_user ON totp_recovery_codes (user_id);
