import { useState, useEffect, useRef, useCallback } from 'react'
import type { Check, Change } from './useApi'

// Use relative URLs when running from the same server (Docker container)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export function useSSE() {
  const [checks, setChecks] = useState<Check[]>([])
  const [changes, setChanges] = useState<Change[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch initial data on mount
  const fetchInitialData = useCallback(async () => {
    try {
      // Fetch recent checks
      const checksResponse = await fetch(`${API_BASE}/api/checks?limit=50`)
      if (checksResponse.ok) {
        const checksData: Check[] = await checksResponse.json()
        setChecks(checksData)
      }

      // Fetch recent changes (last 24 hours worth, up to 100)
      const changesResponse = await fetch(`${API_BASE}/api/changes?limit=100`)
      if (changesResponse.ok) {
        const changesData: Change[] = await changesResponse.json()
        // Filter to last 24 hours for dashboard display
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const recentChanges = changesData.filter(change => {
          try {
            return new Date(change.created_at) >= oneDayAgo
          } catch {
            return false
          }
        })
        setChanges(recentChanges)
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err)
    }
  }, [])

  useEffect(() => {
    // Fetch initial data
    fetchInitialData()

    // Initialize EventSource
    const eventSource = new EventSource(`${API_BASE}/api/events`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'connected') {
          console.log('SSE connected:', data.timestamp)
        } else if (data.type === 'check') {
          console.log('New check received:', data.data)
          setChecks((prev) => {
            // Avoid duplicates
            if (prev.some(c => c.id === data.data.id)) return prev
            return [data.data, ...prev].slice(0, 100)
          })
        } else if (data.type === 'change') {
          console.log('New change received:', data.data)
          setChanges((prev) => {
            // Avoid duplicates
            if (prev.some(c => c.id === data.data.id)) return prev
            return [data.data, ...prev].slice(0, 100)
          })

          // Show browser notification for critical changes
          if (data.data.priority === 'CRITICAL' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('🚨 Critical Change Detected!', {
                body: `${data.data.url_name}: ${data.data.description}`,
                icon: '/favicon.ico',
              })
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                  new Notification('🚨 Critical Change Detected!', {
                    body: `${data.data.url_name}: ${data.data.description}`,
                    icon: '/favicon.ico',
                  })
                }
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      setIsConnected(false)

      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect SSE...')
        eventSource.close()
        // The useEffect will re-run and create a new connection
      }, 5000)
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [])

  return {
    checks,
    changes,
    isConnected,
  }
}
