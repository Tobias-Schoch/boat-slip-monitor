'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  animation?: 'bounce' | 'rotate' | 'none'
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  animation = 'bounce',
  className = '',
  children,
}: EmptyStateProps) {
  const animationProps =
    animation === 'bounce'
      ? {
          animate: { y: [-5, 5, -5] },
          transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
        }
      : animation === 'rotate'
      ? {
          animate: { rotate: 360 },
          transition: { duration: 2, repeat: Infinity, ease: 'linear' as const },
        }
      : {}

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`glass-ultra rounded-2xl p-16 text-center ${className}`}
    >
      <motion.div className="mb-6 flex justify-center" {...animationProps}>
        <Icon className="w-16 h-16 text-muted" />
      </motion.div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </motion.div>
  )
}
