-- V18: pôles + pipeline recrutement (compatible membership PENDING/APPROVED/REJECTED)

CREATE TABLE poles (
    id              UUID                        NOT NULL PRIMARY KEY,
    name            VARCHAR(120)                NOT NULL,
    description     TEXT,
    active          BOOLEAN                     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT uq_poles_name UNIQUE (name)
);

CREATE TABLE user_poles (
    user_id         UUID                        NOT NULL,
    pole_id         UUID                        NOT NULL,
    assigned_at     TIMESTAMP WITH TIME ZONE    NOT NULL,
    PRIMARY KEY (user_id, pole_id),
    CONSTRAINT fk_user_poles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_poles_pole FOREIGN KEY (pole_id) REFERENCES poles (id) ON DELETE CASCADE
);

CREATE INDEX idx_user_poles_pole ON user_poles (pole_id);

CREATE TABLE recruitment_entries (
    id              UUID                        NOT NULL PRIMARY KEY,
    user_id         UUID                        NOT NULL,
    pole_id         UUID,
    stage           VARCHAR(32)                 NOT NULL,
    notes           TEXT,
    interview_at    TIMESTAMP WITH TIME ZONE,
    decided_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT uq_recruitment_entries_user UNIQUE (user_id),
    CONSTRAINT fk_recruitment_entries_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_recruitment_entries_pole FOREIGN KEY (pole_id) REFERENCES poles (id) ON DELETE SET NULL,
    CONSTRAINT ck_recruitment_stage CHECK (stage IN (
        'CANDIDATURE', 'ENTRETIEN', 'DECISION', 'ACCEPTED', 'REJECTED'
    ))
);

CREATE INDEX idx_recruitment_entries_stage ON recruitment_entries (stage);
-- Backfill PENDING → CANDIDATURE is done lazily by RecruitmentService (H2 + Postgres).
