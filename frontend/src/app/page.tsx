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
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="relative container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="text-7xl mb-6 animate-float">🚤</div>
            <h1 className="text-5xl font-bold mb-4">
              <span className="gradient-text">Welcome to Boat Slip Monitor</span>
            </h1>
            <p className="text-muted text-xl max-w-2xl mx-auto leading-relaxed">
              Let's get you set up with notifications and monitoring.
            </p>
          </div>

          {/* Setup Form with glassmorphism */}
          <div className="animate-scale-in">
            <SetupForm onComplete={handleSetupComplete} />
          </div>

          {/* Footer */}
          <div className="mt-16 text-center">
            <p className="text-muted/60 text-sm">
              🚤 Boat Slip Monitor v2.0 • Monitoring German boat slip registration pages
            </p>
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
          <div className="relative">
            <div className="animate-spin w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-6" />
            <div className="absolute inset-0 animate-pulse">
              <div className="w-16 h-16 border-4 border-transparent border-t-accent rounded-full mx-auto opacity-50" />
            </div>
          </div>
          <p className="text-muted text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Main app
  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent -z-10" />

      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl backdrop-saturate-150 border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-card/80 to-card/40 -z-10" />

        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl animate-float">🚤</div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  Boat Slip Monitor
                </h1>
                <p className="text-sm text-muted mt-1">
                  Monitoring boat slip registration pages
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection status */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isConnected
                    ? 'bg-success shadow-glow animate-pulse'
                    : 'bg-error'
                }`} />
                <span className="text-xs font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-3">
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { id: 'urls', label: `🔗 URLs (${urls?.length || 0})`, icon: '🔗' },
              { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'glass-card text-foreground shadow-glow btn-glow'
                    : 'text-muted hover:text-foreground hover:bg-card/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && <Dashboard checks={checks} changes={changes} />}
          {activeTab === 'urls' && <UrlList urls={urls} loading={loading} />}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold gradient-text mb-2">Settings</h2>
                <p className="text-muted text-lg">
                  Update your notification settings and monitoring configuration.
                </p>
              </div>
              <SetupForm onComplete={() => {
                // Show success message
                const successDiv = document.createElement('div')
                successDiv.className = 'fixed top-4 right-4 glass-card text-success px-6 py-4 rounded-xl shadow-glow-lg animate-slide-in-right z-50'
                successDiv.innerHTML = '✅ Settings updated successfully!'
                document.body.appendChild(successDiv)
                setTimeout(() => {
                  successDiv.style.opacity = '0'
                  successDiv.style.transition = 'opacity 0.3s'
                  setTimeout(() => successDiv.remove(), 300)
                }, 3000)

                setTimeout(() => window.location.reload(), 3500)
              }} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-muted/60 text-sm">
            Boat Slip Monitor v2.0 • Built with FastAPI & Next.js
          </p>
        </div>
      </footer>
    </div>
  )
}
