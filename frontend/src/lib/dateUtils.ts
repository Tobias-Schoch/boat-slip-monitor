/**
 * Centralized date formatting utilities for consistent date/time display.
 */

export interface FormatOptions {
  includeSeconds?: boolean
  fallback?: string
}

const DEFAULT_TIMEZONE = 'Europe/Berlin'
const DEFAULT_LOCALE = 'de-DE'

/**
 * Parse and validate a date string.
 * Returns null if invalid.
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date
  } catch {
    return null
  }
}

/**
 * Format a date string to full date and time.
 * Example: "04.02.2026, 14:30:45"
 */
export function formatDate(
  dateStr: string | undefined,
  options: FormatOptions = {}
): string {
  const { includeSeconds = true, fallback = 'Unbekannt' } = options
  const date = parseDate(dateStr)
  if (!date) return fallback

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: DEFAULT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }

  if (includeSeconds) {
    formatOptions.second = '2-digit'
  }

  return date.toLocaleString(DEFAULT_LOCALE, formatOptions)
}

/**
 * Format a date string to time only.
 * Example: "14:30:45"
 */
export function formatTime(
  dateStr: string | undefined,
  fallback: string = '--:--:--'
): string {
  const date = parseDate(dateStr)
  if (!date) return fallback

  return date.toLocaleTimeString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Format a date string to date and time without seconds.
 * Example: "04.02.2026, 14:30"
 */
export function formatDateTime(
  dateStr: string | undefined,
  fallback: string = 'Nie'
): string {
  const date = parseDate(dateStr)
  if (!date) return fallback

  return date.toLocaleString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a date string to date only.
 * Example: "04.02.2026"
 */
export function formatDateOnly(
  dateStr: string | undefined,
  fallback: string = 'Unbekannt'
): string {
  const date = parseDate(dateStr)
  if (!date) return fallback

  return date.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format a date string as relative time (e.g., "vor 5 Minuten").
 */
export function formatRelativeTime(dateStr: string | undefined): string {
  const date = parseDate(dateStr)
  if (!date) return 'Unbekannt'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'gerade eben'
  if (diffMinutes < 60) return `vor ${diffMinutes} Minute${diffMinutes !== 1 ? 'n' : ''}`
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours !== 1 ? 'n' : ''}`
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`

  return formatDateOnly(dateStr)
}
