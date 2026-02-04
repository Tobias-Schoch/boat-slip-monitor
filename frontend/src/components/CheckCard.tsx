import type { Check } from '@/lib/useApi'

interface CheckCardProps {
  check: Check
}

export function CheckCard({ check }: CheckCardProps) {
  const statusColors = {
    SUCCESS: 'bg-success',
    FAILED: 'bg-error',
    TIMEOUT: 'bg-warning',
  }

  const statusColor = statusColors[check.status] || 'bg-muted'

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full mt-2 ${statusColor} animate-pulse`} />

          {/* Check Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">
                {check.url_name || 'Unknown URL'}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  check.status === 'SUCCESS'
                    ? 'bg-success/20 text-success'
                    : check.status === 'FAILED'
                    ? 'bg-error/20 text-error'
                    : 'bg-warning/20 text-warning'
                }`}
              >
                {check.status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted">
              <span>
                {new Date(check.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>•</span>
              <span>{check.duration_ms}ms</span>
              {check.status_code && (
                <>
                  <span>•</span>
                  <span>HTTP {check.status_code}</span>
                </>
              )}
            </div>

            {check.error && (
              <p className="text-sm text-error mt-2 font-mono">{check.error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
