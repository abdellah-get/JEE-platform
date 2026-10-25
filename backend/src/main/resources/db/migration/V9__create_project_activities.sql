CREATE TABLE project_activities (
    id             UUID         NOT NULL PRIMARY KEY,
    project_id     UUID         NOT NULL,
    actor_user_id  UUID         NOT NULL,
    type           VARCHAR(64)  NOT NULL,
    message        VARCHAR(500) NOT NULL,
    task_id        UUID,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_project_activities_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_activities_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_project_activities_type CHECK (type IN (
        'TASK_CREATED',
        'TASK_STATUS_CHANGED',
        'TASK_DELETED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED'
    ))
);

CREATE INDEX idx_project_activities_project_created ON project_activities (project_id, created_at DESC);
