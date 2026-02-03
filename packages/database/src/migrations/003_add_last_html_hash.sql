-- Add lastHtmlHash column to monitored_urls for tracking the last known HTML state
-- This allows comparing against the previous state without querying checks table

ALTER TABLE monitored_urls
ADD COLUMN IF NOT EXISTS last_html_hash VARCHAR(64);

-- Create index for potential lookups
CREATE INDEX IF NOT EXISTS idx_monitored_urls_last_html_hash ON monitored_urls(last_html_hash);
