'use client'

import { useState } from 'react'
import { Send, Mail, MessageCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { BaseCard } from './ui/BaseCard'

type TestResult = {
  status: 'success' | 'error'
  message: string
}

export function TestNotifications() {
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [telegramResult, setTelegramResult] = useState<TestResult | null>(null)
  const [emailResult, setEmailResult] = useState<TestResult | null>(null)

  const testTelegram = async () => {
    setTelegramLoading(true)
    setTelegramResult(null)

    try {
      const res = await fetch('/api/test-notifications/telegram', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setTelegramResult({
          status: 'error',
          message: data.detail || 'Fehler beim Versenden',
        })
      } else {
        setTelegramResult(data)
      }
    } catch (error) {
      setTelegramResult({
        status: 'error',
        message: 'Netzwerkfehler: ' + (error as Error).message,
      })
    } finally {
      setTelegramLoading(false)
    }
  }

  const testEmail = async () => {
    setEmailLoading(true)
    setEmailResult(null)

    try {
      const res = await fetch('/api/test-notifications/email', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setEmailResult({
          status: 'error',
          message: data.detail || 'Fehler beim Versenden',
        })
      } else {
        setEmailResult(data)
      }
    } catch (error) {
      setEmailResult({
        status: 'error',
        message: 'Netzwerkfehler: ' + (error as Error).message,
      })
    } finally {
      setEmailLoading(false)
    }
  }

  const ResultMessage = ({ result }: { result: TestResult }) => (
    <div
      className={`mt-3 flex items-center gap-2 p-3 rounded-lg ${
        result.status === 'success'
          ? 'bg-green-500/10 text-green-400'
          : 'bg-red-500/10 text-red-400'
      }`}
    >
      {result.status === 'success' ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <XCircle className="w-5 h-5" />
      )}
      <span className="text-sm">{result.message}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="glass-ultra rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-400" />
          Test-Benachrichtigungen
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Teste deine Benachrichtigungs-Konfiguration durch manuelles Versenden von Test-Nachrichten.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Telegram Test */}
          <BaseCard>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Telegram</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Sendet eine Test-Nachricht an deinen konfigurierten Telegram-Chat
                </p>
                <Button
                  onClick={testTelegram}
                  disabled={telegramLoading}
                  className="w-full"
                >
                  {telegramLoading ? 'Wird gesendet...' : 'Telegram-Test senden'}
                </Button>
                {telegramResult && <ResultMessage result={telegramResult} />}
              </div>
            </div>
          </BaseCard>

          {/* Email Test */}
          <BaseCard>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">E-Mail</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Sendet eine Test-E-Mail an deine konfigurierte E-Mail-Adresse
                </p>
                <Button
                  onClick={testEmail}
                  disabled={emailLoading}
                  className="w-full"
                >
                  {emailLoading ? 'Wird gesendet...' : 'E-Mail-Test senden'}
                </Button>
                {emailResult && <ResultMessage result={emailResult} />}
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      {/* Info Box */}
      <div className="glass-ultra rounded-xl p-4 border border-blue-500/20 bg-blue-500/5">
        <p className="text-sm text-slate-300">
          <strong>Hinweis:</strong> Stelle sicher, dass Telegram und E-Mail im Tab "Einstellungen" korrekt konfiguriert sind.
          Test-Nachrichten erscheinen nicht in der Änderungs-Historie.
        </p>
      </div>
    </div>
  )
}
