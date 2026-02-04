'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
}

function AnimatedNumber({ value, duration = 2 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setDisplayValue(Math.round(eased * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, value, duration])

  return <span ref={ref}>{displayValue}</span>
}

type StatColor = 'primary' | 'success' | 'warning' | 'error'

interface StatCardProps {
  icon: string
  label: string
  value: number
  suffix?: string
  color: StatColor
  delay?: number
}

const colorClasses: Record<StatColor, { bg: string; border: string; text: string; shadow: string }> = {
  primary: {
    bg: 'from-primary/20 to-primary/5',
    border: 'border-primary/30',
    text: 'text-primary',
    shadow: 'shadow-primary/20',
  },
  success: {
    bg: 'from-success/20 to-success/5',
    border: 'border-success/30',
    text: 'text-success',
    shadow: 'shadow-success/20',
  },
  warning: {
    bg: 'from-warning/20 to-warning/5',
    border: 'border-warning/30',
    text: 'text-warning',
    shadow: 'shadow-warning/20',
  },
  error: {
    bg: 'from-error/20 to-error/5',
    border: 'border-error/30',
    text: 'text-error',
    shadow: 'shadow-error/20',
  },
}

function StatCard({ icon, label, value, suffix = '', color, delay = 0 }: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        scale: 1.02,
        y: -5,
        transition: { duration: 0.2 },
      }}
      className={`
        relative overflow-hidden rounded-2xl p-6
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        shadow-xl ${colors.shadow}
        hover:shadow-2xl
        transition-shadow duration-300
        group
      `}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Icon with glow */}
      <div className="text-4xl mb-4 relative">
        <span className="relative z-10">{icon}</span>
        <div className={`absolute inset-0 blur-xl ${colors.text} opacity-30`}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className={`text-4xl font-black ${colors.text} mb-2`}>
        <AnimatedNumber value={value} />
        {suffix}
      </div>

      {/* Label */}
      <div className="text-sm text-muted font-medium uppercase tracking-wider">
        {label}
      </div>

      {/* Decorative corner accent */}
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors.text} opacity-5 rounded-bl-full`}
      />
    </motion.div>
  )
}

interface StatsSectionProps {
  totalChecks: number
  changesDetected: number
  criticalChanges: number
  urlsMonitored: number
}

export function StatsSection({
  totalChecks,
  changesDetected,
  criticalChanges,
  urlsMonitored,
}: StatsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
    >
      <StatCard
        icon="📊"
        label="Total Checks"
        value={totalChecks}
        color="primary"
        delay={0}
      />
      <StatCard
        icon="🔔"
        label="Changes Detected"
        value={changesDetected}
        color="warning"
        delay={0.1}
      />
      <StatCard
        icon="🚨"
        label="Critical Alerts"
        value={criticalChanges}
        color="error"
        delay={0.2}
      />
      <StatCard
        icon="🌐"
        label="URLs Monitored"
        value={urlsMonitored}
        color="success"
        delay={0.3}
      />
    </motion.div>
  )
}
