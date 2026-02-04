'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface FloatingOrbProps {
  className: string
  animate: {
    x: number[]
    y: number[]
  }
  duration: number
}

function FloatingOrb({ className, animate, duration }: FloatingOrbProps) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[100px] ${className}`}
      animate={animate}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

interface ParticleProps {
  style: React.CSSProperties
}

function Particle({ style }: ParticleProps) {
  return (
    <div
      className="absolute w-1 h-1 bg-white/20 rounded-full animate-drift"
      style={style}
    />
  )
}

function ParticleField() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${5 + Math.random() * 10}s`,
      } as React.CSSProperties,
    })),
  [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <Particle key={p.id} style={p.style} />
      ))}
    </div>
  )
}

interface HeroHeaderProps {
  isConnected: boolean
}

export function HeroHeader({ isConnected }: HeroHeaderProps) {
  return (
    <div className="relative min-h-[35vh] flex items-center overflow-hidden">
      {/* Floating Orbs Background */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb
          className="w-[500px] h-[500px] bg-primary/20 top-[10%] left-[5%]"
          animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
          duration={20}
        />
        <FloatingOrb
          className="w-[350px] h-[350px] bg-purple-500/15 top-[30%] right-[10%]"
          animate={{ x: [0, -60, 50, 0], y: [0, 80, -20, 0] }}
          duration={15}
        />
        <FloatingOrb
          className="w-[250px] h-[250px] bg-accent/20 bottom-[15%] left-[25%]"
          animate={{ x: [0, 50, -30, 0], y: [0, -40, 60, 0] }}
          duration={18}
        />
      </div>

      {/* Particle Field */}
      <ParticleField />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          {/* Animated Icon */}
          <motion.div
            className="text-7xl md:text-8xl mb-6 inline-block"
            animate={{
              y: [-5, 5, -5],
              rotate: [-2, 2, -2],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]">
              🚤
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-black mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <span className="gradient-text">
              Boat Slip Monitor
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Real-time monitoring for boat slip availability.
            <span className="text-primary font-semibold"> Never miss an opening.</span>
          </motion.p>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="inline-flex items-center gap-3 glass-ultra rounded-full px-6 py-3"
          >
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isConnected ? 'bg-success' : 'bg-error'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected ? 'bg-success' : 'bg-error'
                }`}
              />
            </span>
            <span className="text-sm font-medium text-foreground">
              {isConnected ? 'System Active' : 'Connecting...'}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
