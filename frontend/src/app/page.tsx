'use client'

import { useState, useEffect } from 'react'
import { Dashboard } from '@/components/Dashboard'
import { UrlList } from '@/components/UrlList'
import { SetupForm } from '@/components/SetupForm'
import { useSSE } from '@/lib/useSSE'
import { useApi } from '@/lib/useApi'

// Use relative URLs when running from the same server (Docker container)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'urls' | 'settings'>('dashboard')
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const { checks, changes, isConnected } = useSSE()
  const { urls, loading } = useApi()

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/setup-status`)
      const data = await response.json()
      setIsConfigured(data.configured)

      // If not configured, show setup automatically
      if (!data.configured) {
        setShowSetup(true)
      }
    } catch (error) {
      console.error('Failed to check setup status:', error)
      // If check fails, assume not configured
      setIsConfigured(false)
      setShowSetup(true)
    }
  }

  const handleSetupComplete = () => {
    setShowSetup(false)
    setIsConfigured(true)
    // Reload the page to start scheduler
    window.location.reload()
  }

  // Show setup screen if not configured
  if (showSetup || isConfigured === false) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="text-6xl mb-4">🚤</div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Welcome to Boat Slip Monitor
            </h1>
            <p className="text-muted text-lg">
              Let's get you set up! Configure your notification channels and monitoring settings.
            </p>
          </div>

          {/* Setup Form */}
          <SetupForm onComplete={handleSetupComplete} />

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-muted">
            <p>🚤 Boat Slip Monitor v2.0 • Monitoring German boat slip registration pages</p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isConfigured === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                🚤 Boat Slip Monitor
              </h1>
              <p className="text-sm text-muted mt-1">
                Monitoring boat slip registration pages
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-success animate-pulse' : 'bg-error'
                  }`}
                />
                <span className="text-xs text-muted">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-white shadow-lg shadow-primary/50'
                  : 'bg-background text-muted hover:text-foreground hover:bg-card'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('urls')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'urls'
                  ? 'bg-primary text-white shadow-lg shadow-primary/50'
                  : 'bg-background text-muted hover:text-foreground hover:bg-card'
              }`}
            >
              🔗 URLs ({urls?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-primary text-white shadow-lg shadow-primary/50'
                  : 'bg-background text-muted hover:text-foreground hover:bg-card'
              }`}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard checks={checks} changes={changes} />}
        {activeTab === 'urls' && <UrlList urls={urls} loading={loading} />}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-6">⚙️ Settings</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-muted mb-6">
                Update your notification settings and monitoring configuration.
              </p>
              <SetupForm onComplete={() => {
                alert('Settings updated successfully! Reloading...')
                window.location.reload()
              }} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted">
          <p>Boat Slip Monitor v2.0 • Built with FastAPI & Next.js</p>
        </div>
      </footer>
    </div>
  )
}
