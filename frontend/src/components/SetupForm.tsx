'use client'

import { useState, useEffect } from 'react'

// Use relative URLs when running from the same server (Docker container)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

interface SetupFormProps {
  onComplete?: () => void
}

export function SetupForm({ onComplete }: SetupFormProps) {
  const [activeSection, setActiveSection] = useState<'telegram' | 'email' | 'advanced'>(
    'telegram'
  )
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Telegram (required)
    telegram_bot_token: '',
    telegram_chat_id: '',

    // Email (optional)
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_from: 'Boat Monitor <noreply@example.com>',
    smtp_to: '',

    // Advanced settings
    log_level: 'INFO',
    check_interval_working: '*/5 7-17 * * *',
    check_interval_off: '*/3 0-6,18-23 * * *',
    page_timeout_ms: 30000,
    max_retry_attempts: 3,
    max_screenshots_per_url: 50,
    screenshot_retention_days: 30,
    notification_cooldown_minutes: 10,
    max_notification_retries: 3,
  })

  useEffect(() => {
    loadCurrentSettings()
  }, [])

  const loadCurrentSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/settings`)
      if (response.ok) {
        const data = await response.json()
        // Merge with existing formData to preserve defaults
        setFormData(prev => ({
          ...prev,
          ...data
        }))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.telegram_bot_token || !formData.telegram_chat_id) {
      setError('Telegram Bot-Token und Chat-ID sind erforderlich')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const result = await response.json()

      if (result.success) {
        // Call onComplete callback
        if (onComplete) {
          onComplete()
        }
      } else {
        throw new Error(result.message || 'Failed to save settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Einstellungen werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('telegram')}
          className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
            activeSection === 'telegram'
              ? 'bg-primary text-white'
              : 'bg-card text-muted hover:text-foreground'
          }`}
        >
          1. Telegram (Pflicht)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('email')}
          className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
            activeSection === 'email'
              ? 'bg-primary text-white'
              : 'bg-card text-muted hover:text-foreground'
          }`}
        >
          2. E-Mail (Optional)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('advanced')}
          className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
            activeSection === 'advanced'
              ? 'bg-primary text-white'
              : 'bg-card text-muted hover:text-foreground'
          }`}
        >
          3. Erweitert
        </button>
      </div>

      {/* Telegram Section */}
      {activeSection === 'telegram' && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              🤖 Telegram-Konfiguration
            </h3>
            <p className="text-sm text-muted mb-6">
              Telegram wird für Benachrichtigungen benötigt. Folge diesen Schritten:
            </p>

            <div className="mb-6 p-4 bg-background rounded-lg space-y-3 text-sm">
              <div>
                <span className="font-bold text-primary">Schritt 1:</span> Schreibe{' '}
                <a
                  href="https://t.me/botfather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  @BotFather
                </a>{' '}
                auf Telegram
              </div>
              <div>
                <span className="font-bold text-primary">Schritt 2:</span> Sende{' '}
                <code className="bg-muted px-2 py-1 rounded">/newbot</code> und folge den
                Anweisungen
              </div>
              <div>
                <span className="font-bold text-primary">Schritt 3:</span> Kopiere das Bot-Token
              </div>
              <div>
                <span className="font-bold text-primary">Schritt 4:</span> Schreibe deinem Bot,
                dann öffne{' '}
                <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                  https://api.telegram.org/bot&lt;DEIN_TOKEN&gt;/getUpdates
                </code>
              </div>
              <div>
                <span className="font-bold text-primary">Schritt 5:</span> Finde deine Chat-ID in
                der Antwort
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bot-Token *
            </label>
            <input
              type="text"
              value={formData.telegram_bot_token}
              onChange={(e) =>
                setFormData({ ...formData, telegram_bot_token: e.target.value })
              }
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Chat-ID *
            </label>
            <input
              type="text"
              value={formData.telegram_chat_id}
              onChange={(e) =>
                setFormData({ ...formData, telegram_chat_id: e.target.value })
              }
              placeholder="123456789"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>
      )}

      {/* Email Section */}
      {activeSection === 'email' && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              📧 E-Mail-Konfiguration (Optional)
            </h3>
            <p className="text-sm text-muted mb-4">
              Füge E-Mail-Benachrichtigungen als Backup hinzu. Für Gmail nutze ein{' '}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                App-Passwort
              </a>
              .
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                SMTP-Server
              </label>
              <input
                type="text"
                value={formData.smtp_host}
                onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                SMTP-Port
              </label>
              <input
                type="number"
                value={formData.smtp_port}
                onChange={(e) =>
                  setFormData({ ...formData, smtp_port: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                SMTP-Benutzer
              </label>
              <input
                type="email"
                value={formData.smtp_user}
                onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                placeholder="deine_email@gmail.com"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                SMTP-Passwort (App-Passwort)
              </label>
              <input
                type="password"
                value={formData.smtp_password}
                onChange={(e) =>
                  setFormData({ ...formData, smtp_password: e.target.value })
                }
                placeholder="dein_app_passwort"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Absender-Adresse
              </label>
              <input
                type="text"
                value={formData.smtp_from}
                onChange={(e) => setFormData({ ...formData, smtp_from: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Empfänger-Adresse
              </label>
              <input
                type="email"
                value={formData.smtp_to}
                onChange={(e) => setFormData({ ...formData, smtp_to: e.target.value })}
                placeholder="empfaenger@beispiel.de"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Section */}
      {activeSection === 'advanced' && (
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">⚙️ Erweiterte Einstellungen</h3>
            <p className="text-sm text-muted mb-4">
              Überwachungs- und Benachrichtigungsverhalten anpassen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Log-Level
              </label>
              <select
                value={formData.log_level}
                onChange={(e) => setFormData({ ...formData, log_level: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Seiten-Timeout (ms)
              </label>
              <input
                type="number"
                value={formData.page_timeout_ms}
                onChange={(e) =>
                  setFormData({ ...formData, page_timeout_ms: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Check-Intervall (Arbeitszeit 7-17 Uhr)
              </label>
              <input
                type="text"
                value={formData.check_interval_working}
                onChange={(e) =>
                  setFormData({ ...formData, check_interval_working: e.target.value })
                }
                placeholder="*/5 7-17 * * *"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted mt-1">
                Cron-Format: alle 5 Minuten während der Arbeitszeit
              </p>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Check-Intervall (Außerhalb 0-6 Uhr, 18-23 Uhr)
              </label>
              <input
                type="text"
                value={formData.check_interval_off}
                onChange={(e) =>
                  setFormData({ ...formData, check_interval_off: e.target.value })
                }
                placeholder="*/3 0-6,18-23 * * *"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted mt-1">
                Cron-Format: alle 3 Minuten außerhalb der Arbeitszeit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max. Screenshots pro URL
              </label>
              <input
                type="number"
                value={formData.max_screenshots_per_url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_screenshots_per_url: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Screenshot-Aufbewahrung (Tage)
              </label>
              <input
                type="number"
                value={formData.screenshot_retention_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    screenshot_retention_days: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Benachrichtigungs-Pause (Minuten)
              </label>
              <input
                type="number"
                value={formData.notification_cooldown_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notification_cooldown_minutes: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max. Benachrichtigungs-Versuche
              </label>
              <input
                type="number"
                value={formData.max_notification_retries}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_notification_retries: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error rounded-lg p-4">
          <p className="text-error font-medium">❌ {error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={() => {
            if (activeSection === 'email') setActiveSection('telegram')
            else if (activeSection === 'advanced') setActiveSection('email')
          }}
          disabled={activeSection === 'telegram'}
          className="px-4 md:px-6 py-2 rounded-lg font-medium bg-muted text-foreground hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Zurück
        </button>

        {activeSection !== 'advanced' ? (
          <button
            type="button"
            onClick={() => {
              if (activeSection === 'telegram') setActiveSection('email')
              else if (activeSection === 'email') setActiveSection('advanced')
            }}
            className="px-4 md:px-6 py-2 rounded-lg font-medium bg-primary text-white hover:bg-accent transition-colors"
          >
            Weiter →
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="px-4 md:px-6 py-2 rounded-lg font-medium bg-primary text-white hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Speichern...
              </>
            ) : (
              '✓ Einrichtung abschließen'
            )}
          </button>
        )}
      </div>
    </form>
  )
}
