-- =========================================================
-- ADMIN EMAIL + PASSWORD RESET
-- Run this ONCE in pgAdmin (your local database) AND in the
-- Neon SQL Editor (the live database).
--
-- 1) admin_password_reset_tokens : stores (hashed) reset links
--    for admins, the same way password_reset_tokens does it
--    for customers.
-- 2) email_logs.admin_id         : lets the email log record which
--    admin an email was for (also used to limit reset emails to
--    3 per hour per admin).
-- =========================================================

CREATE TABLE IF NOT EXISTS admin_password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_reset_tokens_admin
  ON admin_password_reset_tokens (admin_id);

ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS admin_id INTEGER;

CREATE INDEX IF NOT EXISTS email_logs_admin_type_time
  ON email_logs (admin_id, email_type, created_at);
