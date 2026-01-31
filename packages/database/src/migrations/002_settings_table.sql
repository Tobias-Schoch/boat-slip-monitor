-- Settings table for editable configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO app_settings (key, value, description, category) VALUES
  ('telegram_bot_token', '', 'Telegram Bot Token vom BotFather', 'notifications'),
  ('telegram_chat_id', '', 'Telegram Chat ID für Benachrichtigungen', 'notifications'),
  ('smtp_host', '', 'SMTP Server Host (z.B. smtp.gmail.com)', 'email'),
  ('smtp_port', '587', 'SMTP Server Port', 'email'),
  ('smtp_secure', 'false', 'SMTP TLS/SSL verwenden', 'email'),
  ('smtp_user', '', 'SMTP Benutzername / E-Mail', 'email'),
  ('smtp_password', '', 'SMTP Passwort / App-Passwort', 'email'),
  ('smtp_from', '', 'Absender E-Mail Adresse', 'email'),
  ('smtp_to', '', 'Empfänger E-Mail Adresse', 'email'),
  ('check_interval_minutes', '5', 'Prüfintervall in Minuten', 'monitoring'),
  ('log_level', 'info', 'Log Level (debug, info, warn, error)', 'monitoring'),
  ('screenshot_dir', './data/screenshots', 'Verzeichnis für Screenshots', 'monitoring')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON app_settings(key);
