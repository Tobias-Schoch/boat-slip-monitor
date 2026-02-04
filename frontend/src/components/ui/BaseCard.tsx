'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type CardVariant = 'success' | 'error' | 'warning' | 'info' | 'critical' | 'important'

interface BaseCardProps {
  variant: CardVariant
  icon?: ReactNode
  title: string
  subtitle?: string
  badge?: ReactNode
  metadata?: ReactNode
  children?: ReactNode
  pulse?: boolean
  index?: number
  className?: string
  onClick?: () => void
}

const variantConfig: Record<CardVariant, {
  bg: string
  border: string
  glow: string
  iconBg: string
  text: string
}> = {
  critical: {
    bg: 'from-error/30 via-error/10 to-transparent',
    border: 'border-error/50',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
    iconBg: 'bg-error/20',
    text: 'text-error',
  },
  important: {
    bg: 'from-warning/25 via-warning/10 to-transparent',
    border: 'border-warning/40',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    iconBg: 'bg-warning/20',
    text: 'text-warning',
  },
  warning: {
    bg: 'from-warning/20 to-warning/5',
    border: 'border-warning/30',
    glow: 'shadow-warning/20',
    iconBg: 'bg-warning/20',
    text: 'text-warning',
  },
  info: {
    bg: 'from-primary/20 via-primary/5 to-transparent',
    border: 'border-primary/30',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    iconBg: 'bg-primary/20',
    text: 'text-primary',
  },
  success: {
    bg: 'from-success/20 to-success/5',
    border: 'border-success/30',
    glow: 'shadow-success/20',
    iconBg: 'bg-success/20',
    text: 'text-success',
  },
  error: {
    bg: 'from-error/20 to-error/5',
    border: 'border-error/30',
    glow: 'shadow-error/20',
    iconBg: 'bg-error/20',
    text: 'text-error',
  },
}

export function BaseCard({
  variant,
  icon,
  title,
  subtitle,
  badge,
  metadata,
  children,
  pulse = false,
  index = 0,
  className = '',
  onClick,
}: BaseCardProps) {
  const config = variantConfig[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br ${config.bg}
        border-2 ${config.border}
        ${config.glow}
        backdrop-blur-xl
        transition-all duration-500
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Animated border glow for pulse */}
      {pulse && (
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
      <div className="relative p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            {/* Animated icon */}
            {icon && (
              <motion.div
                className={`p-3 rounded-xl ${config.iconBg}`}
                animate={pulse ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {icon}
              </motion.div>
            )}

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-xl text-foreground">{title}</h3>
                {badge}
              </div>

              {subtitle && (
                <p className="text-sm text-muted">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Metadata slot */}
          {metadata && <div className="text-right">{metadata}</div>}
        </div>

        {/* Children content */}
        {children}
      </div>
    </motion.div>
  )
}

export { variantConfig }
