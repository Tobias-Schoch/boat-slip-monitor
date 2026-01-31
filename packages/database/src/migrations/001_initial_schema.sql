-- Initial schema for boat slip monitor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Monitored URLs table
CREATE TABLE IF NOT EXISTS monitored_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(1000) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    check_interval INTEGER NOT NULL DEFAULT 5,
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_checked TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on enabled URLs
CREATE INDEX IF NOT EXISTS idx_monitored_urls_enabled ON monitored_urls(enabled) WHERE enabled = true;

-- Checks table
CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES monitored_urls(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    response_time INTEGER NOT NULL,
    status_code INTEGER,
    error TEXT,
    html_hash VARCHAR(64),
    screenshot_path VARCHAR(500),
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for checks
CREATE INDEX IF NOT EXISTS idx_checks_url_id ON checks(url_id);
CREATE INDEX IF NOT EXISTS idx_checks_checked_at ON checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_checks_html_hash ON checks(html_hash);

-- HTML Snapshots table
CREATE TABLE IF NOT EXISTS html_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
    html_hash VARCHAR(64) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    normalized_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on html_hash
CREATE INDEX IF NOT EXISTS idx_html_snapshots_hash ON html_snapshots(html_hash);

-- Changes table
CREATE TABLE IF NOT EXISTS changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
    url_id UUID NOT NULL REFERENCES monitored_urls(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    diff TEXT,
    matched_keywords TEXT,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for changes
CREATE INDEX IF NOT EXISTS idx_changes_url_id ON changes(url_id);
CREATE INDEX IF NOT EXISTS idx_changes_priority ON changes(priority);
CREATE INDEX IF NOT EXISTS idx_changes_detected_at ON changes(detected_at DESC);

-- Screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on check_id
CREATE INDEX IF NOT EXISTS idx_screenshots_check_id ON screenshots(check_id);

-- Detected Forms table
CREATE TABLE IF NOT EXISTS detected_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_id UUID NOT NULL REFERENCES changes(id) ON DELETE CASCADE,
    form_type VARCHAR(10) NOT NULL,
    form_url VARCHAR(1000) NOT NULL,
    fields TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on change_id
CREATE INDEX IF NOT EXISTS idx_detected_forms_change_id ON detected_forms(change_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_id UUID NOT NULL REFERENCES changes(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    error TEXT,
    message_id VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_change_id ON notifications(change_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Notification Channels table
CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(50) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    config TEXT NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- System Metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit VARCHAR(50),
    tags VARCHAR(500),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on metric_name and recorded_at
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at DESC);

-- Seed initial monitored URLs
INSERT INTO monitored_urls (url, name, description) VALUES
('https://www.konstanz.de/stadt+gestalten/bauen+_+wohnen/privat+bauen/bootsliegeplatz', 'Konstanz Bootsliegeplatz', 'Hauptseite der Stadt Konstanz für Bootsliegeplätze'),
('https://www.konstanz.de/serviceportal/-/leistungen+von+a-z/neubeantragung-bootsliegeplatz-bootsliegeplaetze/vbid6001501', 'Konstanz Serviceportal', 'Serviceportal der Stadt Konstanz für Bootsliegeplatz-Antrag')
ON CONFLICT (url) DO NOTHING;
