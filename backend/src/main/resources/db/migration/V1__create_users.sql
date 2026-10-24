-- V1: comptes club + rôle transverse (MEMBRE / BUREAU / ADMIN_TECH)
CREATE TABLE users (
    id              UUID         NOT NULL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    club_role       VARCHAR(32)  NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_club_role CHECK (club_role IN ('MEMBRE', 'BUREAU', 'ADMIN_TECH'))
);

CREATE INDEX idx_users_club_role ON users (club_role);
CREATE INDEX idx_users_active ON users (active);
