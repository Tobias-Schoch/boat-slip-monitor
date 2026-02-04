'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, ExternalLink, ChevronDown, Clock } from 'lucide-react'
import type { Change } from '@/lib/useApi'

type Priority = 'CRITICAL' | 'IMPORTANT' | 'INFO'

interface ChangeCardProps {
  change: Change
  index?: number
}

const priorityIcons = {
  CRITICAL: AlertCircle,
  IMPORTANT: AlertTriangle,
  INFO: Info,
}

const priorityConfig: Record<Priority, {
  bg: string
  border: string
  glow: string
  iconBg: string
  text: string
  pulse: boolean
}> = {
  CRITICAL: {
    bg: 'from-error/30 via-error/10 to-transparent',
    border: 'border-error/50',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
    iconBg: 'bg-error/20',
    text: 'text-error',
    pulse: true,
  },
  IMPORTANT: {
    bg: 'from-warning/25 via-warning/10 to-transparent',
    border: 'border-warning/40',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    iconBg: 'bg-warning/20',
    text: 'text-warning',
    pulse: false,
  },
  INFO: {
    bg: 'from-primary/20 via-primary/5 to-transparent',
    border: 'border-primary/30',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    iconBg: 'bg-primary/20',
    text: 'text-primary',
    pulse: false,
  },
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Unbekannt'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Unbekannt'
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return 'Unbekannt'
  }
}

function formatConfidence(confidence: number | undefined): number {
  if (confidence === undefined || confidence === null || isNaN(confidence)) return 0
  return Math.round(confidence * 100)
}

export function ChangeCard({ change, index = 0 }: ChangeCardProps) {
  const [showDiff, setShowDiff] = useState(false)
  const config = priorityConfig[change.priority] || priorityConfig.INFO
  const confidencePercent = formatConfidence(change.confidence)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.01 }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br ${config.bg}
        border-2 ${config.border}
        ${config.glow}
        backdrop-blur-xl
        transition-all duration-500
      `}
    >
      {/* Animated border glow for critical */}
      {config.pulse && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 20px rgba(239,68,68,0.3)',
              '0 0 40px rgba(239,68,68,0.5)',
              '0 0 20px rgba(239,68,68,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid opacity-10" />

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            {/* Animated icon */}
            <motion.div
              className={`p-3 rounded-xl ${config.iconBg}`}
              animate={config.pulse ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {(() => {
                const Icon = priorityIcons[change.priority] || priorityIcons.INFO
                return <Icon className={`w-7 h-7 ${config.text}`} />
              })()}
            </motion.div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-xl text-foreground">
                  {change.url_name || 'Unknown URL'}
                </h3>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`px-3 py-1 rounded-full text-xs font-black ${config.text} bg-current/10`}
                >
                  {change.priority}
                </motion.span>
              </div>

              <p className="text-sm text-muted flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatDate(change.created_at)}
              </p>
            </div>
          </div>

          {/* Type badge */}
          <div className="text-right">
            <div className="text-xs text-muted mb-1 uppercase tracking-wider">Typ</div>
            <div className="text-sm font-semibold text-foreground px-3 py-1 rounded-lg bg-white/5">
              {change.type}
            </div>
          </div>
        </div>

        {/* Description */}
        <motion.p
          className="text-foreground leading-relaxed mb-4 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {change.description}
        </motion.p>

        {/* Keywords */}
        {change.matched_keywords && change.matched_keywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <div className="text-xs text-muted mb-2 uppercase tracking-wider">
              Gefundene Keywords
            </div>
            <div className="flex flex-wrap gap-2">
              {change.matched_keywords.map((keyword, i) => (
                <motion.span
                  key={keyword}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-foreground text-sm font-medium border border-white/10 hover:bg-white/20 transition-colors cursor-default"
                >
                  {keyword}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
          {change.url && (
            <motion.a
              href={change.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:text-primary-light font-semibold transition-colors group"
              whileHover={{ x: 3 }}
            >
              Seite öffnen
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
          )}

          {change.diff && (
            <motion.button
              onClick={() => setShowDiff(!showDiff)}
              className="flex items-center gap-2 text-muted hover:text-foreground font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showDiff ? 'rotate-180' : ''}`} />
              {showDiff ? 'Diff ausblenden' : 'Diff anzeigen'}
            </motion.button>
          )}

          {/* Confidence meter */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">Confidence</span>
            <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className={`h-full ${config.text} bg-current`}
                initial={{ width: 0 }}
                animate={{ width: `${confidencePercent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <span className="text-xs font-mono text-foreground">
              {confidencePercent}%
            </span>
          </div>
        </div>

        {/* Diff View */}
        <AnimatePresence>
          {showDiff && change.diff && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-4 bg-black/30 rounded-xl border border-white/5 overflow-x-auto">
                <div className="text-sm font-mono space-y-1">
                  {change.diff.split('\n').map((line, i) => {
                    const isAddition = line.startsWith('+ ')
                    const isDeletion = line.startsWith('- ')

                    return (
                      <div
                        key={i}
                        className={`px-2 py-0.5 rounded ${
                          isAddition
                            ? 'bg-success/20 text-success border-l-2 border-success'
                            : isDeletion
                            ? 'bg-error/20 text-error border-l-2 border-error'
                            : 'text-muted'
                        }`}
                      >
                        <span className="whitespace-pre-wrap break-all">{line}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
