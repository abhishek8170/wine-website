-- =========================================================
-- EMAIL LOG TABLE
-- Run this ONCE in pgAdmin (your local database) AND in the
-- Neon SQL Editor (the live database).
--
-- It records every email the website tries to send, so you can
-- see what happened ("sent", "failed" or "skipped" and why),
-- stop the same email being sent twice, and limit how many
-- password-reset emails one customer can request per hour.
-- =========================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id                  SERIAL PRIMARY KEY,
  customer_id         INTEGER,
  notification_id     INTEGER,
  email_type          VARCHAR(60)  NOT NULL,
  to_email            VARCHAR(255) NOT NULL,
  subject             VARCHAR(255),
  status              VARCHAR(20)  NOT NULL,   -- sent | failed | skipped
  provider_message_id VARCHAR(160),
  error_message       TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- one email per in-app notification
CREATE UNIQUE INDEX IF NOT EXISTS email_logs_notification_unique
  ON email_logs (notification_id)
  WHERE notification_id IS NOT NULL
    AND status IN ('sent', 'skipped');

CREATE INDEX IF NOT EXISTS email_logs_customer_type_time
  ON email_logs (customer_id, email_type, created_at);
