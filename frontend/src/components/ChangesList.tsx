'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2 } from 'lucide-react'
import type { Change } from '@/lib/useApi'
import { ChangeCard } from './ChangeCard'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
const PAGE_SIZE = 20

type FilterPriority = 'all' | 'CRITICAL' | 'IMPORTANT' | 'INFO'

const filterButtons: { id: FilterPriority; label: string; activeClass: string }[] = [
  { id: 'all', label: 'Alle', activeClass: 'bg-primary text-white shadow-primary/30' },
  { id: 'CRITICAL', label: 'Kritisch', activeClass: 'bg-error text-white shadow-error/30' },
  { id: 'IMPORTANT', label: 'Wichtig', activeClass: 'bg-warning text-white shadow-warning/30' },
  { id: 'INFO', label: 'Info', activeClass: 'bg-primary text-white shadow-primary/30' },
]

export function ChangesList() {
  const [changes, setChanges] = useState<Change[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterPriority>('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchChanges = useCallback(async (pageNum: number, priority: FilterPriority, append = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', String(PAGE_SIZE))
      params.append('offset', String(pageNum * PAGE_SIZE))
      if (priority !== 'all') {
        params.append('priority', priority)
      }

      const response = await fetch(`${API_BASE}/api/changes?${params}`)
      if (!response.ok) throw new Error('Failed to fetch changes')

      const data: Change[] = await response.json()

      if (append) {
        setChanges(prev => [...prev, ...data])
      } else {
        setChanges(data)
      }

      setHasMore(data.length === PAGE_SIZE)
      setTotalCount(prev => append ? prev : (data.length < PAGE_SIZE ? data.length : PAGE_SIZE * 10)) // Estimate
    } catch (err) {
      console.error('Failed to fetch changes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    fetchChanges(0, filter, false)
  }, [filter, fetchChanges])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchChanges(nextPage, filter, true)
  }

  const handleFilterChange = (newFilter: FilterPriority) => {
    setFilter(newFilter)
    setChanges([])
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Alle Änderungen</h2>
          <p className="text-muted text-sm mt-1">
            {changes.length} Änderungen geladen
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <motion.button
              key={btn.id}
              onClick={() => handleFilterChange(btn.id)}
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

      {/* Changes List */}
      <AnimatePresence mode="wait">
        {loading && changes.length === 0 ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-16"
          >
            <div className="text-center">
              <motion.div
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-muted">Loading changes...</p>
            </div>
          </motion.div>
        ) : changes.length === 0 ? (
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
            <h3 className="text-xl font-bold text-foreground mb-2">No changes found</h3>
            <p className="text-muted">
              {filter !== 'all'
                ? `No ${filter} changes detected yet`
                : 'No changes have been detected yet'}
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
            {changes.map((change, index) => (
              <ChangeCard key={change.id} change={change} index={index % PAGE_SIZE} />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-6"
              >
                <motion.button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-white/10 text-foreground font-semibold hover:bg-white/20 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* End of list indicator */}
            {!hasMore && changes.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 text-muted text-sm"
              >
                — End of changes —
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
