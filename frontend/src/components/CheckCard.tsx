'use client'

import { motion } from 'framer-motion'
import { Clock, Zap, ChevronRight } from 'lucide-react'
import type { Check } from '@/lib/useApi'

type CheckStatus = 'SUCCESS' | 'FAILED' | 'TIMEOUT'

interface CheckCardProps {
  check: Check
  index?: number
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '--:--:--'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '--:--:--'
    return date.toLocaleTimeString('de-DE', {
      timeZone: 'Europe/Berlin',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '--:--:--'
  }
}

const statusConfig: Record<CheckStatus, {
  bg: string
  border: string
  dot: string
  text: string
  shadow: string
}> = {
  SUCCESS: {
    bg: 'from-success/20 to-success/5',
    border: 'border-success/30',
    dot: 'bg-success',
    text: 'text-success',
    shadow: 'shadow-success/20',
  },
  FAILED: {
    bg: 'from-error/20 to-error/5',
    border: 'border-error/30',
    dot: 'bg-error',
    text: 'text-error',
    shadow: 'shadow-error/20',
  },
  TIMEOUT: {
    bg: 'from-warning/20 to-warning/5',
    border: 'border-warning/30',
    dot: 'bg-warning',
    text: 'text-warning',
    shadow: 'shadow-warning/20',
  },
}

export function CheckCard({ check, index = 0 }: CheckCardProps) {
  const config = statusConfig[check.status] || statusConfig.SUCCESS

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.01, x: 4 }}
      className={`
        relative overflow-hidden rounded-xl p-4
        bg-gradient-to-r ${config.bg}
        border ${config.border}
        shadow-lg ${config.shadow}
        hover:shadow-xl
        transition-shadow duration-300
        group
      `}
    >
      {/* Progress bar indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 overflow-hidden">
        <motion.div
          className={`h-full ${config.dot}`}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Animated status dot */}
        <div className="relative">
          <span className="flex h-3 w-3 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`}
            />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${config.dot}`} />
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground truncate">
              {check.url_name || 'Unknown URL'}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${config.text} bg-current/10`}
            >
              {check.status}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(check.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {check.duration_ms}ms
            </span>
            {check.status_code && (
              <span className="font-mono text-xs">HTTP {check.status_code}</span>
            )}
          </div>

          {check.error && (
            <p className="text-sm text-error mt-2 font-mono truncate">{check.error}</p>
          )}
        </div>

        {/* Arrow indicator */}
        <motion.div
          className="text-muted opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ x: -5 }}
          whileHover={{ x: 0 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  )
}
