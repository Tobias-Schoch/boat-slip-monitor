'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

export function Dashboard({ checks, changes, urls = [] }: DashboardProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredChanges = changes.filter((change) => {
    if (filter === 'all') return true
    if (filter === 'critical') return change.priority === 'CRITICAL'
    if (filter === 'important') return change.priority === 'IMPORTANT'
    return true
  })

  const criticalCount = changes.filter((c) => c.priority === 'CRITICAL').length

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
          <h2 className="text-2xl font-bold text-foreground">Recent Changes</h2>
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
                className="text-6xl mb-6"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                🔍
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">No changes detected yet</h3>
              <p className="text-muted">
                Checks are running automatically every 3-5 minutes
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
              {filteredChanges.map((change, index) => (
                <ChangeCard key={change.id} change={change} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Recent Checks */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-6">Recent Checks</h2>

        <AnimatePresence mode="wait">
          {checks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-ultra rounded-2xl p-16 text-center"
            >
              <motion.div
                className="text-6xl mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                ⏳
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2">Waiting for first check...</h3>
              <p className="text-muted">
                The monitoring system is initializing
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
              {checks.slice(0, 10).map((check, index) => (
                <CheckCard key={check.id} check={check} index={index} />
              ))}

              {checks.length > 10 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-4"
                >
                  <span className="text-muted text-sm">
                    Showing 10 of {checks.length} recent checks
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  )
}
