-- V3: tâches Kanban + % avancement projet
ALTER TABLE projects
    ADD COLUMN progress_percent INTEGER NOT NULL DEFAULT 0;

ALTER TABLE projects
    ADD CONSTRAINT ck_projects_progress CHECK (progress_percent >= 0 AND progress_percent <= 100);

CREATE TABLE tasks (
    id              UUID         NOT NULL PRIMARY KEY,
    project_id      UUID         NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    status          VARCHAR(32)  NOT NULL,
    priority        VARCHAR(16)  NOT NULL,
    assignee_id     UUID,
    due_date        DATE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    created_by      UUID         NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id),
    CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT ck_tasks_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    CONSTRAINT ck_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
);

CREATE INDEX idx_tasks_project ON tasks (project_id);
CREATE INDEX idx_tasks_assignee ON tasks (assignee_id);
CREATE INDEX idx_tasks_status ON tasks (status);
CREATE INDEX idx_tasks_project_status ON tasks (project_id, status);
