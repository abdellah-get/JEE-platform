CREATE TABLE project_attachments (
    id               UUID         NOT NULL PRIMARY KEY,
    project_id       UUID         NOT NULL,
    task_id          UUID,
    uploaded_by_id   UUID         NOT NULL,
    original_name    VARCHAR(255) NOT NULL,
    content_type     VARCHAR(120) NOT NULL,
    size_bytes       BIGINT       NOT NULL,
    storage_key      VARCHAR(512) NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_project_attachments_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_attachments_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL,
    CONSTRAINT fk_project_attachments_uploader FOREIGN KEY (uploaded_by_id) REFERENCES users (id),
    CONSTRAINT uq_project_attachments_storage_key UNIQUE (storage_key)
);

CREATE INDEX idx_project_attachments_project ON project_attachments (project_id);
CREATE INDEX idx_project_attachments_project_created ON project_attachments (project_id, created_at DESC);
