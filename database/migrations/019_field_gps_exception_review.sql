ALTER TABLE gps_validation_logs
    ADD COLUMN IF NOT EXISTS review_status VARCHAR(40) NOT NULL DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS review_justification TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'gps_validation_logs_review_status_check'
    ) THEN
        ALTER TABLE gps_validation_logs
            ADD CONSTRAINT gps_validation_logs_review_status_check
            CHECK (review_status IN ('Pending', 'Accepted', 'Rejected'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gps_validation_review_status
    ON gps_validation_logs(review_status, created_at DESC);
