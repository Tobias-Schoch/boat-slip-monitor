'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock } from 'lucide-react'
import type { Check, Change, MonitoredUrl } from '@/lib/useApi'
import { CheckCard } from './CheckCard'
import { ChangeCard } from './ChangeCard'
import { StatsSection } from './StatsSection'

type FilterType = 'all' | 'critical' | 'important'

interface DashboardProps {
  checks: Check[]
  changes: Change[]
  urls?: MonitoredUrl[]
}

const filterButtons: { id: FilterType; label: string; activeClass: string }[] = [
  { id: 'all', label: 'All', activeClass: 'bg-primary text-white shadow-primary/30' },
  { id: 'critical', label: 'Critical', activeClass: 'bg-error text-white shadow-error/30' },
  { id: 'important', label: 'Important', activeClass: 'bg-warning text-white shadow-warning/30' },
]

const COLLAPSED_LIMIT = 3

export function Dashboard({ checks, changes, urls = [] }: DashboardProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [showAllChanges, setShowAllChanges] = useState(false)

  const filteredChanges = changes.filter((change) => {
    if (filter === 'all') return true
    if (filter === 'critical') return change.priority === 'CRITICAL'
    if (filter === 'important') return change.priority === 'IMPORTANT'
    return true
  })

  // When filter is active, show all. Otherwise respect collapsed state
  const displayedChanges = (filter !== 'all' || showAllChanges)
    ? filteredChanges
    : filteredChanges.slice(0, COLLAPSED_LIMIT)

  const hasMoreChanges = filter === 'all' && filteredChanges.length > COLLAPSED_LIMIT

  const criticalCount = changes.filter((c) => c.priority === 'CRITICAL').length

  // Get the last check for each URL
  const lastCheckPerUrl = useMemo(() => {
    const urlMap = new Map<string, typeof checks[0]>()
    // checks are sorted newest first, so first occurrence is the latest
    for (const check of checks) {
      if (!urlMap.has(check.url_id)) {
        urlMap.set(check.url_id, check)
      }
    }
    return Array.from(urlMap.values())
  }, [checks])

  return (
    <div className="space-y-10">
      {/* Stats Overview */}
      <StatsSection
        totalChecks={checks.length}
        changesDetected={changes.length}
        criticalChanges={criticalCount}
        urlsMonitored={urls.length}
      />

      {/* Recent Changes */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Letzte Änderungen</h2>
          <div className="flex gap-2">
            {filterButtons.map((btn) => (
              <motion.button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  filter === btn.id
                    ? `${btn.activeClass} shadow-lg`
                    : 'bg-white/5 text-muted hover:text-foreground hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {btn.label}
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filteredChanges.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-ultra rounded-2xl p-16 text-center"
            >
              <motion.div
                className="mb-6 flex justify-center"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Search className="w-16 h-16 text-muted" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">Keine Änderungen gefunden</h3>
              <p className="text-muted">
                Checks laufen automatisch alle 3-5 Minuten
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {displayedChanges.map((change, index) => (
                <ChangeCard key={change.id} change={change} index={index} />
              ))}

              {/* Show more/less button */}
              {hasMoreChanges && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowAllChanges(!showAllChanges)}
                  className="w-full py-3 rounded-xl bg-white/5 text-muted hover:text-foreground hover:bg-white/10 font-medium transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {showAllChanges
                    ? 'Weniger anzeigen'
                    : `${filteredChanges.length - COLLAPSED_LIMIT} weitere anzeigen`}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Last Check per URL */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Letzter Check pro URL</h2>
          <span className="text-sm text-muted px-3 py-1 rounded-lg bg-white/5">
            {lastCheckPerUrl.length} URLs
          </span>
        </div>

        <AnimatePresence mode="wait">
          {lastCheckPerUrl.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-ultra rounded-2xl p-16 text-center"
            >
              <motion.div
                className="mb-6 flex justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Clock className="w-16 h-16 text-muted" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">Noch keine Checks vorhanden</h3>
              <p className="text-muted">
                Warte auf den ersten Check-Zyklus...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {lastCheckPerUrl.map((check, index) => (
                <CheckCard key={check.id} check={check} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  )
}
