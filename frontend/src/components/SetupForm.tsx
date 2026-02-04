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
      setError('Telegram Bot Token and Chat ID are required')
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
          <p className="text-muted">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => setActiveSection('telegram')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'telegram'
              ? 'bg-primary text-white'
              : 'bg-card text-muted hover:text-foreground'
          }`}
        >
          1. Telegram (Required)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('email')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'email'
              ? 'bg-primary text-white'
              : 'bg-card text-muted hover:text-foreground'
          }`}
        >
          2. Email (Optional)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('advanced')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSection === 'advanced'
              ? 'bg-primary text-white'
              : 'bg-card text-muted hover:text-foreground'
          }`}
        >
          3. Advanced
        </button>
      </div>

      {/* Telegram Section */}
      {activeSection === 'telegram' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              🤖 Telegram Configuration
            </h3>
            <p className="text-sm text-muted mb-6">
              Telegram is required for receiving notifications. Follow these steps:
            </p>

            <div className="mb-6 p-4 bg-background rounded-lg space-y-3 text-sm">
              <div>
                <span className="font-bold text-primary">Step 1:</span> Message{' '}
                <a
                  href="https://t.me/botfather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  @BotFather
                </a>{' '}
                on Telegram
              </div>
              <div>
                <span className="font-bold text-primary">Step 2:</span> Send{' '}
                <code className="bg-muted px-2 py-1 rounded">/newbot</code> and follow
                instructions
              </div>
              <div>
                <span className="font-bold text-primary">Step 3:</span> Copy the bot token
              </div>
              <div>
                <span className="font-bold text-primary">Step 4:</span> Message your bot,
                then visit{' '}
                <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                  https://api.telegram.org/bot&lt;YOUR_TOKEN&gt;/getUpdates
                </code>
              </div>
              <div>
                <span className="font-bold text-primary">Step 5:</span> Find your Chat ID in
                the response
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bot Token *
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
              Chat ID *
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
        <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              📧 Email Configuration (Optional)
            </h3>
            <p className="text-sm text-muted mb-4">
              Add email notifications as a backup channel. For Gmail, use an{' '}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                App Password
              </a>
              .
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                SMTP Host
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
                SMTP Port
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
                SMTP User
              </label>
              <input
                type="email"
                value={formData.smtp_user}
                onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                placeholder="your_email@gmail.com"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                SMTP Password (App Password)
              </label>
              <input
                type="password"
                value={formData.smtp_password}
                onChange={(e) =>
                  setFormData({ ...formData, smtp_password: e.target.value })
                }
                placeholder="your_app_password"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                From Address
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
                To Address
              </label>
              <input
                type="email"
                value={formData.smtp_to}
                onChange={(e) => setFormData({ ...formData, smtp_to: e.target.value })}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Section */}
      {activeSection === 'advanced' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">⚙️ Advanced Settings</h3>
            <p className="text-sm text-muted mb-4">
              Fine-tune monitoring and notification behavior.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Log Level
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
                Page Timeout (ms)
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

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Check Interval (Working Hours 7-17h)
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
                Cron format: every 5 minutes during working hours
              </p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Check Interval (Off Hours 0-6h, 18-23h)
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
                Cron format: every 3 minutes during off hours
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max Screenshots per URL
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
                Screenshot Retention (days)
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
                Notification Cooldown (minutes)
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
                Max Notification Retries
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
          className="px-6 py-2 rounded-lg font-medium bg-muted text-foreground hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {activeSection !== 'advanced' ? (
          <button
            type="button"
            onClick={() => {
              if (activeSection === 'telegram') setActiveSection('email')
              else if (activeSection === 'email') setActiveSection('advanced')
            }}
            className="px-6 py-2 rounded-lg font-medium bg-primary text-white hover:bg-accent transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg font-medium bg-primary text-white hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              '✓ Complete Setup'
            )}
          </button>
        )}
      </div>
    </form>
  )
}
