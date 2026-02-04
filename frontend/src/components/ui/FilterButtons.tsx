'use client'

import { motion } from 'framer-motion'

export interface FilterButton<T extends string> {
  id: T
  label: string
  activeClass: string
}

interface FilterButtonsProps<T extends string> {
  buttons: FilterButton<T>[]
  activeFilter: T
  onChange: (filter: T) => void
  className?: string
}

export function FilterButtons<T extends string>({
  buttons,
  activeFilter,
  onChange,
  className = '',
}: FilterButtonsProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {buttons.map((btn) => (
        <motion.button
          key={btn.id}
          onClick={() => onChange(btn.id)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
            activeFilter === btn.id
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
  )
}
