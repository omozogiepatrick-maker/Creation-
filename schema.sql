-- Provaxis database schema (Postgres / Neon)
-- Run this once in the Neon SQL editor (steps in README-SETUP.md) to create the table.

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  project_type TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
