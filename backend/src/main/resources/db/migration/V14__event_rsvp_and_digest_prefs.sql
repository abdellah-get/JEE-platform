-- V14: RSVP événements + préférences digest email

CREATE TABLE event_rsvps (
    id          UUID                        NOT NULL PRIMARY KEY,
    event_id    UUID                        NOT NULL,
    user_id     UUID                        NOT NULL,
    status      VARCHAR(16)                 NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_event_rsvps_event FOREIGN KEY (event_id) REFERENCES club_events (id) ON DELETE CASCADE,
    CONSTRAINT fk_event_rsvps_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_event_rsvps_event_user UNIQUE (event_id, user_id),
    CONSTRAINT ck_event_rsvps_status CHECK (status IN ('GOING', 'MAYBE', 'DECLINED'))
);

CREATE INDEX idx_event_rsvps_event ON event_rsvps (event_id);
CREATE INDEX idx_event_rsvps_user ON event_rsvps (user_id);

ALTER TABLE notifications DROP CONSTRAINT ck_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type
    CHECK (type IN ('TASK_ASSIGNED', 'ANNOUNCEMENT_PINNED', 'EVENT_PINNED', 'EVENT_RSVP'));

ALTER TABLE users ADD COLUMN email_digest_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN digest_frequency VARCHAR(16) NOT NULL DEFAULT 'WEEKLY';
ALTER TABLE users ADD COLUMN notify_task_assigned BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN notify_announcement_pinned BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN notify_event_pinned BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN last_digest_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users ADD CONSTRAINT ck_users_digest_frequency
    CHECK (digest_frequency IN ('DAILY', 'WEEKLY'));
