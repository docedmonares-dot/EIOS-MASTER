CREATE TABLE IF NOT EXISTS enterprise_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(80) NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'Info'
        CHECK (severity IN ('Info', 'Success', 'Warning', 'Critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_permission_code VARCHAR(160),
    source_type VARCHAR(100),
    source_id VARCHAR(200),
    action_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE (source_type, source_id)
);

CREATE TABLE IF NOT EXISTS enterprise_notification_receipts (
    notification_id UUID NOT NULL
        REFERENCES enterprise_notifications(notification_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_notifications_created
    ON enterprise_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enterprise_notification_receipts_user
    ON enterprise_notification_receipts(user_id, read_at DESC);
