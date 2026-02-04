import type { MonitoredUrl } from '@/lib/useApi'

interface UrlListProps {
  urls: MonitoredUrl[]
  loading: boolean
}

export function UrlList({ urls, loading }: UrlListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading URLs...</p>
        </div>
      </div>
    )
  }

  if (urls.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <div className="text-4xl mb-4">📋</div>
        <p className="text-muted">No URLs configured</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-6">Monitored URLs</h2>

      <div className="grid gap-4">
        {urls.map((url, index) => (
          <div
            key={url.id}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{url.name}</h3>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        url.enabled ? 'bg-success' : 'bg-muted'
                      }`}
                    />
                    <span className="text-xs text-muted">
                      {url.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {url.description && (
                  <p className="text-sm text-muted mb-3">{url.description}</p>
                )}

                {/* URL */}
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all block mb-3"
                >
                  {url.url}
                </a>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-xs text-muted">
                  <div>
                    <span className="font-medium">Check Interval:</span> Every{' '}
                    {url.check_interval_minutes} minutes
                  </div>
                  {url.last_checked && (
                    <div>
                      <span className="font-medium">Last Checked:</span>{' '}
                      {new Date(url.last_checked).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                  {url.last_hash && (
                    <div>
                      <span className="font-medium">Hash:</span>{' '}
                      <span className="font-mono">{url.last_hash.slice(0, 12)}...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
