CREATE TABLE notifications (
    id          UUID         NOT NULL PRIMARY KEY,
    user_id     UUID         NOT NULL,
    type        VARCHAR(64)  NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        TEXT,
    link        VARCHAR(500),
    read_at     TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_notifications_type CHECK (type IN ('TASK_ASSIGNED', 'ANNOUNCEMENT_PINNED'))
);

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at);
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read_at);
