-- V17: finance légère — budget projet + notes de frais

CREATE TABLE project_budgets (
    project_id      UUID                        NOT NULL PRIMARY KEY,
    amount_cents    BIGINT                      NOT NULL,
    currency        VARCHAR(8)                  NOT NULL DEFAULT 'MAD',
    updated_by      UUID,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_project_budgets_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_budgets_user FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_project_budgets_amount CHECK (amount_cents >= 0)
);

CREATE TABLE expense_claims (
    id              UUID                        NOT NULL PRIMARY KEY,
    project_id      UUID                        NOT NULL,
    submitter_id    UUID                        NOT NULL,
    category        VARCHAR(32)                 NOT NULL,
    amount_cents    BIGINT                      NOT NULL,
    description     VARCHAR(500)                NOT NULL,
    status          VARCHAR(32)                 NOT NULL,
    receipt_note    VARCHAR(500),
    decided_by      UUID,
    decided_at      TIMESTAMP WITH TIME ZONE,
    decision_note   VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_expense_claims_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_claims_submitter FOREIGN KEY (submitter_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_claims_decider FOREIGN KEY (decided_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_expense_claims_amount CHECK (amount_cents > 0)
);

CREATE INDEX idx_expense_claims_project ON expense_claims (project_id);
CREATE INDEX idx_expense_claims_status ON expense_claims (status);
CREATE INDEX idx_expense_claims_submitter ON expense_claims (submitter_id);
