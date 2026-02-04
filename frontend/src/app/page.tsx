'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dashboard } from '@/components/Dashboard'
import { UrlList } from '@/components/UrlList'
import { useSSE } from '@/lib/useSSE'
import { useApi } from '@/lib/useApi'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'urls'>('dashboard')
  const [setupChecked, setSetupChecked] = useState(false)
  const { checks, changes, isConnected } = useSSE()
  const { urls, loading } = useApi()

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/setup-status`)
      const data = await response.json()

      if (!data.configured) {
        // Not configured, redirect to setup
        router.push('/setup')
      } else {
        setSetupChecked(true)
      }
    } catch (error) {
      console.error('Failed to check setup status:', error)
      // If check fails, assume configured and continue
      setSetupChecked(true)
    }
  }

  if (!setupChecked) {
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-white'
                  : 'bg-background text-muted hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('urls')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'urls'
                  ? 'bg-primary text-white'
                  : 'bg-background text-muted hover:text-foreground'
              }`}
            >
              URLs ({urls?.length || 0})
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          <Dashboard checks={checks} changes={changes} />
        ) : (
          <UrlList urls={urls} loading={loading} />
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
