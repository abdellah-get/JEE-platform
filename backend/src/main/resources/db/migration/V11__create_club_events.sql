CREATE TABLE club_events (
    id              UUID         NOT NULL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT         NOT NULL,
    location        VARCHAR(255),
    starts_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at         TIMESTAMP WITH TIME ZONE,
    pinned          BOOLEAN      NOT NULL DEFAULT FALSE,
    created_by_id   UUID         NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_club_events_creator FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE INDEX idx_club_events_starts_at ON club_events (starts_at);
CREATE INDEX idx_club_events_pinned_starts ON club_events (pinned DESC, starts_at ASC);
