-- V4: annonces club (pin = urgent)
CREATE TABLE announcements (
    id              UUID         NOT NULL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    body            TEXT         NOT NULL,
    pinned          BOOLEAN      NOT NULL DEFAULT FALSE,
    author_id       UUID         NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE INDEX idx_announcements_pinned_created ON announcements (pinned DESC, created_at DESC);
