'use client';

import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Mail, Activity, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { AppSetting } from '@boat-monitor/database';

interface SettingsContentProps {
  initialSettings: AppSetting[];
}

export function SettingsContent({ initialSettings }: SettingsContentProps) {
  const [settings, setSettings] = useState<Record<string, string>>(
    initialSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value || '' }), {})
  );
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to save');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const categories = {
    notifications: {
      title: 'Telegram Benachrichtigungen',
      icon: Bell,
      gradient: 'from-blue-500 to-cyan-600',
      fields: ['telegram_bot_token', 'telegram_chat_id']
    },
    email: {
      title: 'E-Mail Benachrichtigungen',
      icon: Mail,
      gradient: 'from-purple-500 to-pink-600',
      fields: ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_password', 'smtp_from', 'smtp_to']
    },
    monitoring: {
      title: 'Monitoring Konfiguration',
      icon: Activity,
      gradient: 'from-green-500 to-emerald-600',
      fields: ['check_interval_minutes', 'log_level', 'screenshot_dir']
    }
  };

  const getFieldLabel = (key: string) => {
    const labels: Record<string, string> = {
      telegram_bot_token: 'Bot Token',
      telegram_chat_id: 'Chat ID',
      smtp_host: 'SMTP Server',
      smtp_port: 'Port',
      smtp_secure: 'TLS/SSL aktiviert',
      smtp_user: 'Benutzername / E-Mail',
      smtp_password: 'Passwort',
      smtp_from: 'Absender E-Mail',
      smtp_to: 'Empfänger E-Mail',
      check_interval_minutes: 'Prüfintervall (Minuten)',
      log_level: 'Log Level',
      screenshot_dir: 'Screenshot-Verzeichnis'
    };
    return labels[key] || key;
  };

  const isPasswordField = (key: string) => key.includes('password') || key.includes('token');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/50">
            <SettingsIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 dark:from-orange-400 dark:via-red-400 dark:to-pink-400 bg-clip-text text-transparent">
          Einstellungen
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Konfiguriere Benachrichtigungen und Monitoring
        </p>
      </motion.div>

      {/* Settings Categories */}
      {Object.entries(categories).map(([categoryKey, category], index) => (
        <motion.div
          key={categoryKey}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${category.gradient} shadow-lg`}>
                <category.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{category.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.fields.map((fieldKey) => {
                const setting = initialSettings.find(s => s.key === fieldKey);
                if (!setting) return null;

                const isPassword = isPasswordField(fieldKey);
                const showPassword = showPasswords[fieldKey];

                return (
                  <div key={fieldKey} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {getFieldLabel(fieldKey)}
                    </label>
                    {setting.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{setting.description}</p>
                    )}
                    <div className="relative">
                      {fieldKey === 'smtp_secure' || fieldKey === 'log_level' ? (
                        <select
                          value={settings[fieldKey]}
                          onChange={(e) => setSettings({ ...settings, [fieldKey]: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white"
                        >
                          {fieldKey === 'smtp_secure' ? (
                            <>
                              <option value="false">Nein</option>
                              <option value="true">Ja</option>
                            </>
                          ) : (
                            <>
                              <option value="debug">Debug</option>
                              <option value="info">Info</option>
                              <option value="warn">Warning</option>
                              <option value="error">Error</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <>
                          <input
                            type={isPassword && !showPassword ? 'password' : 'text'}
                            value={settings[fieldKey]}
                            onChange={(e) => setSettings({ ...settings, [fieldKey]: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 dark:text-white pr-12"
                            placeholder={`${getFieldLabel(fieldKey)} eingeben...`}
                          />
                          {isPassword && (
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, [fieldKey]: !showPassword })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Save Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-6 w-6" />
              <span>Erfolgreich gespeichert!</span>
            </>
          ) : (
            <>
              <Save className="h-6 w-6" />
              <span>{saving ? 'Speichert...' : 'Einstellungen speichern'}</span>
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
