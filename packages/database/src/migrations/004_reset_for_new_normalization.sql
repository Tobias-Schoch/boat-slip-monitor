-- Reset database for new HTML normalization
-- This is necessary because the normalization logic changed from DOM-based to regex-based
-- Old normalized HTML included everything minus removed elements
-- New normalized HTML includes ONLY <body> content
-- Without this reset, hash comparisons will always fail

-- Delete all HTML snapshots (old normalized content)
DELETE FROM html_snapshots;

-- Delete all checks (old hashes that don't match new normalization)
DELETE FROM checks;

-- Reset last_html_hash in monitored_urls
UPDATE monitored_urls SET last_html_hash = NULL;

-- Monitored URLs configuration is preserved
