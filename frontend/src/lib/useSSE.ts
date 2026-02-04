import { useState, useEffect, useRef } from 'react'
import type { Check, Change } from './useApi'

// Use relative URLs when running from the same server (Docker container)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export function useSSE() {
  const [checks, setChecks] = useState<Check[]>([])
  const [changes, setChanges] = useState<Change[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
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
          setChecks((prev) => [data.data, ...prev].slice(0, 100))
        } else if (data.type === 'change') {
          console.log('New change received:', data.data)
          setChanges((prev) => [data.data, ...prev].slice(0, 100))

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
