import { useEffect, useState } from 'react'
import type { Check, Change } from '@/lib/useApi'
import { CheckCard } from './CheckCard'
import { ChangeCard } from './ChangeCard'

interface DashboardProps {
  checks: Check[]
  changes: Change[]
}

export function Dashboard({ checks, changes }: DashboardProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'important'>('all')

  const filteredChanges = changes.filter((change) => {
    if (filter === 'all') return true
    if (filter === 'critical') return change.priority === 'CRITICAL'
    if (filter === 'important') return change.priority === 'IMPORTANT'
    return true
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted mb-1">Total Checks</div>
          <div className="text-3xl font-bold text-foreground">{checks.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted mb-1">Changes Detected</div>
          <div className="text-3xl font-bold text-warning">{changes.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted mb-1">Critical Changes</div>
          <div className="text-3xl font-bold text-error">
            {changes.filter((c) => c.priority === 'CRITICAL').length}
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Recent Changes</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-background text-muted hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'critical'
                  ? 'bg-error text-white'
                  : 'bg-background text-muted hover:text-foreground'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('important')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'important'
                  ? 'bg-warning text-white'
                  : 'bg-background text-muted hover:text-foreground'
              }`}
            >
              Important
            </button>
          </div>
        </div>

        {filteredChanges.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-muted">No changes detected yet</p>
            <p className="text-sm text-muted mt-2">
              Checks are running automatically every 3-5 minutes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChanges.map((change, index) => (
              <div
                key={change.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ChangeCard change={change} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Checks */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Recent Checks</h2>

        {checks.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-muted">Waiting for first check...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {checks.slice(0, 10).map((check, index) => (
              <div
                key={check.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CheckCard check={check} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
