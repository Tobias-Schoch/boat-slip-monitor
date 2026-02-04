'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SetupForm } from '@/components/SetupForm'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/setup-status`)
      const data = await response.json()

      if (data.configured) {
        // Already configured, redirect to dashboard
        router.push('/')
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to check setup status:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 px-4">
          <div className="text-6xl mb-4">🚤</div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Willkommen beim Bootsliegeplatz Monitor
          </h1>
          <p className="text-muted text-base md:text-lg">
            Lass uns starten! Konfiguriere deine Benachrichtigungskanäle und Überwachungseinstellungen.
          </p>
        </div>

        {/* Setup Form */}
        <SetupForm />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted px-4">
          <p>Brauchst du Hilfe? Schau in die Dokumentation oder kontaktiere den Support.</p>
        </div>
      </div>
    </div>
  )
}
