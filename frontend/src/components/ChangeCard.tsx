import { useState } from 'react'
import type { Change } from '@/lib/useApi'

interface ChangeCardProps {
  change: Change
}

export function ChangeCard({ change }: ChangeCardProps) {
  const [showDiff, setShowDiff] = useState(false)

  const priorityConfig = {
    CRITICAL: {
      bg: 'bg-error/10',
      border: 'border-error',
      text: 'text-error',
      icon: '🚨',
      glow: 'animate-pulse-glow',
    },
    IMPORTANT: {
      bg: 'bg-warning/10',
      border: 'border-warning',
      text: 'text-warning',
      icon: '⚠️',
      glow: '',
    },
    INFO: {
      bg: 'bg-primary/10',
      border: 'border-primary',
      text: 'text-primary',
      icon: 'ℹ️',
      glow: '',
    },
  }

  const config = priorityConfig[change.priority] || priorityConfig.INFO

  return (
    <div
      className={`${config.bg} border-2 ${config.border} rounded-lg p-6 ${config.glow} transition-all hover:scale-[1.01]`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{config.icon}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground text-lg">
                {change.url_name || 'Unknown URL'}
              </h3>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.text}`}>
                {change.priority}
              </span>
            </div>
            <p className="text-sm text-muted">
              {new Date(change.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted mb-1">Type</div>
          <div className="text-sm font-medium text-foreground">{change.type}</div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-foreground leading-relaxed">{change.description}</p>
      </div>

      {/* Keywords */}
      {change.matched_keywords && change.matched_keywords.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-muted mb-2">Matched Keywords:</div>
          <div className="flex flex-wrap gap-2">
            {change.matched_keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-2 py-1 rounded bg-background text-foreground text-xs font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {change.url && (
          <a
            href={change.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline font-medium"
          >
            View Page →
          </a>
        )}

        {change.diff && (
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="text-sm text-muted hover:text-foreground font-medium transition-colors"
          >
            {showDiff ? 'Hide' : 'Show'} Diff
          </button>
        )}

        <div className="ml-auto text-xs text-muted">
          Confidence: {Math.round(change.confidence * 100)}%
        </div>
      </div>

      {/* Diff View */}
      {showDiff && change.diff && (
        <div className="mt-4 p-4 bg-background rounded-lg overflow-x-auto">
          <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
            {change.diff}
          </pre>
        </div>
      )}
    </div>
  )
}
