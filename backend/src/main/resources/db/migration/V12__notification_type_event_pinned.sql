ALTER TABLE notifications DROP CONSTRAINT ck_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type
    CHECK (type IN ('TASK_ASSIGNED', 'ANNOUNCEMENT_PINNED', 'EVENT_PINNED'));
