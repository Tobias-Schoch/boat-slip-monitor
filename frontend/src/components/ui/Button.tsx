'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode, useState, MouseEvent } from 'react'

interface RippleEffect {
  x: number
  y: number
  id: number
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-primary/50',
  secondary: 'bg-white/10 text-foreground border border-white/20 hover:bg-white/20',
  ghost: 'bg-transparent text-foreground hover:bg-white/10',
  danger: 'bg-gradient-to-r from-error to-error-dark text-white shadow-lg shadow-error/30',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<RippleEffect[]>([])

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    setRipples(prev => [...prev, { x, y, id }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)

    onClick?.(e)
  }

  return (
    <motion.button
      className={`
        relative overflow-hidden
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded-xl font-semibold
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      whileHover={!loading && !disabled ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!loading && !disabled ? { scale: 0.98 } : undefined}
      onClick={handleClick}
      disabled={loading || disabled}
      {...props}
    >
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 300, height: 300, opacity: 0 }}
          style={{ left: ripple.x - 150, top: ripple.y - 150 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <motion.div
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          icon
        )}
        {children}
      </span>
    </motion.button>
  )
}
