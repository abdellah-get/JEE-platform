CREATE TABLE task_comments (
    id          UUID         NOT NULL PRIMARY KEY,
    task_id     UUID         NOT NULL,
    author_id   UUID         NOT NULL,
    body        TEXT         NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_task_comments_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    CONSTRAINT fk_task_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE INDEX idx_task_comments_task ON task_comments (task_id);
CREATE INDEX idx_task_comments_task_created ON task_comments (task_id, created_at);
