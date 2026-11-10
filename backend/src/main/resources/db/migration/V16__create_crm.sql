-- V16: CRM MVP — leads, missions commerciales, devis, contrats

CREATE TABLE crm_leads (
    id              UUID                        NOT NULL PRIMARY KEY,
    company_name    VARCHAR(200)                NOT NULL,
    contact_name    VARCHAR(200),
    contact_email   VARCHAR(255),
    status          VARCHAR(32)                 NOT NULL,
    notes           TEXT,
    owner_id        UUID,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_crm_leads_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_crm_leads_status ON crm_leads (status);
CREATE INDEX idx_crm_leads_owner ON crm_leads (owner_id);

CREATE TABLE crm_missions (
    id              UUID                        NOT NULL PRIMARY KEY,
    lead_id         UUID,
    project_id      UUID,
    title           VARCHAR(200)                NOT NULL,
    description     TEXT,
    status          VARCHAR(32)                 NOT NULL,
    owner_id        UUID,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_crm_missions_lead FOREIGN KEY (lead_id) REFERENCES crm_leads (id) ON DELETE SET NULL,
    CONSTRAINT fk_crm_missions_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
    CONSTRAINT fk_crm_missions_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_crm_missions_status ON crm_missions (status);
CREATE INDEX idx_crm_missions_lead ON crm_missions (lead_id);
CREATE INDEX idx_crm_missions_project ON crm_missions (project_id);

CREATE TABLE crm_quotes (
    id              UUID                        NOT NULL PRIMARY KEY,
    mission_id      UUID                        NOT NULL,
    amount_cents    BIGINT                      NOT NULL,
    currency        VARCHAR(8)                  NOT NULL DEFAULT 'MAD',
    status          VARCHAR(32)                 NOT NULL,
    valid_until     DATE,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_crm_quotes_mission FOREIGN KEY (mission_id) REFERENCES crm_missions (id) ON DELETE CASCADE
);

CREATE INDEX idx_crm_quotes_mission ON crm_quotes (mission_id);

CREATE TABLE crm_contracts (
    id              UUID                        NOT NULL PRIMARY KEY,
    mission_id      UUID                        NOT NULL,
    amount_cents    BIGINT                      NOT NULL,
    currency        VARCHAR(8)                  NOT NULL DEFAULT 'MAD',
    status          VARCHAR(32)                 NOT NULL,
    signed_at       TIMESTAMP WITH TIME ZONE,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL,
    CONSTRAINT fk_crm_contracts_mission FOREIGN KEY (mission_id) REFERENCES crm_missions (id) ON DELETE CASCADE
);

CREATE INDEX idx_crm_contracts_mission ON crm_contracts (mission_id);
