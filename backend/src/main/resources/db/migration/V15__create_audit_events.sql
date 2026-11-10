-- V15: audit trail for sensitive admin actions (no secrets in payload)

CREATE TABLE audit_events (
    id              UUID                        NOT NULL PRIMARY KEY,
    actor_id        UUID,
    actor_email     VARCHAR(255)                NOT NULL,
    action          VARCHAR(64)                 NOT NULL,
    target_type     VARCHAR(64)                 NOT NULL,
    target_id       VARCHAR(64),
    summary         VARCHAR(500)                NOT NULL,
    metadata_json   VARCHAR(2000),
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_audit_events_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_events_created ON audit_events (created_at DESC);
CREATE INDEX idx_audit_events_action ON audit_events (action);
CREATE INDEX idx_audit_events_actor ON audit_events (actor_id);
