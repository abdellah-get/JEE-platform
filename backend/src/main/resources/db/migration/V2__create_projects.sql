-- V2: projets + membres d'équipe (rôles projet)
CREATE TABLE projects (
    id              UUID         NOT NULL PRIMARY KEY,
    name            VARCHAR(160) NOT NULL,
    description     TEXT,
    status          VARCHAR(32)  NOT NULL,
    created_by      UUID         NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT ck_projects_status CHECK (status IN ('BROUILLON', 'ACTIF', 'TERMINE', 'ARCHIVE'))
);

CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_created_by ON projects (created_by);

CREATE TABLE project_members (
    project_id      UUID         NOT NULL,
    user_id         UUID         NOT NULL,
    project_role    VARCHAR(32)  NOT NULL,
    joined_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_project_members PRIMARY KEY (project_id, user_id),
    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT ck_project_members_role CHECK (project_role IN ('CHEF_PROJET', 'CONTRIBUTEUR'))
);

CREATE INDEX idx_project_members_user ON project_members (user_id);
CREATE INDEX idx_project_members_role ON project_members (project_role);
