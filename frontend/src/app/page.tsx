'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Bell, Link2, Settings, FlaskConical, TestTube } from 'lucide-react'
import { Dashboard } from '@/components/Dashboard'
import { UrlList } from '@/components/UrlList'
import { ChangesList } from '@/components/ChangesList'
import { SetupForm } from '@/components/SetupForm'
import { HeroHeader } from '@/components/HeroHeader'
import { TestDiffTab } from '@/components/TestDiffTab'
import { TestNotifications } from '@/components/TestNotifications'
import { useSSE } from '@/lib/useSSE'
import { useApi } from '@/lib/useApi'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

type TabId = 'dashboard' | 'changes' | 'urls' | 'difftester' | 'test' | 'settings'

const tabIcons = {
  dashboard: LayoutDashboard,
  changes: Bell,
  urls: Link2,
  difftester: FlaskConical,
  test: TestTube,
  settings: Settings,
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'changes', label: 'Änderungen' },
  { id: 'urls', label: 'URLs' },
  { id: 'difftester', label: 'Diff-Tester' },
  { id: 'test', label: 'Test' },
  { id: 'settings', label: 'Einstellungen' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const { checks, changes, isConnected } = useSSE()
  const {
    urls,
    loading,
    createUrl,
    updateUrl,
    deleteUrl,
    toggleUrl,
  } = useApi()

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/setup-status`)
      const data = await response.json()
      setIsConfigured(data.configured)

      if (!data.configured) {
        setShowSetup(true)
      }
    } catch (error) {
      console.error('Failed to check setup status:', error)
      setIsConfigured(false)
      setShowSetup(true)
    }
  }

  const handleSetupComplete = () => {
    setShowSetup(false)
    setIsConfigured(true)
    window.location.reload()
  }

  // Setup screen
  if (showSetup || isConfigured === false) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-grid opacity-20" />

        <div className="relative container mx-auto px-4 py-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              className="text-7xl mb-6"
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              🚤
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Willkommen beim Bootsliegeplatz Monitor</span>
            </h1>
            <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-4">
              Lass uns Benachrichtigungen und Überwachung einrichten.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SetupForm onComplete={handleSetupComplete} />
          </motion.div>

          <div className="mt-16 text-center">
            <p className="text-muted/60 text-sm">
              🚤 Boat Slip Monitor v2.0
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 border-4 border-primary/20 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-4 border-4 border-accent/50 rounded-full"
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-muted text-lg">Laden...</p>
        </motion.div>
      </div>
    )
  }

  // Main app
  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-mesh -z-10" />
      <div className="fixed inset-0 bg-grid opacity-10 -z-10" />

      {/* Hero Header */}
      <HeroHeader isConnected={isConnected} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl border-b border-white/10">
        <div className="absolute inset-0 bg-card/60 -z-10" />
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 md:gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-foreground'
                      : 'text-muted hover:text-foreground'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 glass-ultra rounded-xl glow-intense"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1 md:gap-2">
                    {(() => {
                      const Icon = tabIcons[tab.id]
                      return <Icon className="w-4 h-4" />
                    })()}
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.id === 'urls' && (
                      <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                        {urls.length}
                      </span>
                    )}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Connection indicator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-2 glass-ultra rounded-full"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isConnected ? 'bg-success' : 'bg-error'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isConnected ? 'bg-success' : 'bg-error'
                  }`}
                />
              </span>
              <span className="text-xs font-medium text-foreground">
                {isConnected ? 'Aktiv' : 'Getrennt'}
              </span>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard checks={checks} changes={changes} urls={urls} />
            )}
            {activeTab === 'changes' && (
              <ChangesList />
            )}
            {activeTab === 'urls' && (
              <UrlList
                urls={urls}
                loading={loading}
                onCreateUrl={createUrl}
                onUpdateUrl={updateUrl}
                onDeleteUrl={deleteUrl}
                onToggleUrl={toggleUrl}
              />
            )}
            {activeTab === 'difftester' && (
              <TestDiffTab />
            )}
            {activeTab === 'test' && (
              <TestNotifications />
            )}
            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-2">Einstellungen</h2>
                  <p className="text-muted text-base md:text-lg">
                    Benachrichtigungen und Überwachungseinstellungen konfigurieren.
                  </p>
                </motion.div>
                <SetupForm
                  onComplete={() => {
                    const toast = document.createElement('div')
                    toast.className =
                      'fixed top-4 right-4 glass-ultra text-success px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3'
                    toast.innerHTML = `
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Einstellungen erfolgreich gespeichert!
                    `
                    document.body.appendChild(toast)
                    setTimeout(() => {
                      toast.style.opacity = '0'
                      toast.style.transition = 'opacity 0.3s'
                      setTimeout(() => toast.remove(), 300)
                    }, 3000)

                    setTimeout(() => window.location.reload(), 3500)
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12 md:mt-20">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 text-center">
          <p className="text-muted/60 text-sm">
            🚤 Bootsliegeplatz Monitor v2.0 • Erstellt mit FastAPI & Next.js
          </p>
        </div>
      </footer>
    </div>
  )
}
