import { useState, useEffect, useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface MonitoredUrl {
  id: string
  url: string
  name: string
  description?: string
  enabled: boolean
  check_interval_minutes: number
  last_checked?: string
  last_hash?: string
}

export interface UrlCreateData {
  url: string
  name: string
  description?: string
  enabled?: boolean
  check_interval_minutes?: number
}

export interface UrlUpdateData {
  url?: string
  name?: string
  description?: string
  enabled?: boolean
  check_interval_minutes?: number
}

export interface Check {
  id: string
  url_id: string
  timestamp: string
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT'
  duration_ms: number
  status_code?: number
  error?: string
  url_name?: string
}

export interface Change {
  id: string
  check_id: string
  type: 'CONTENT' | 'FORM' | 'KEYWORD' | 'STRUCTURE'
  priority: 'INFO' | 'IMPORTANT' | 'CRITICAL'
  confidence: number
  description: string
  diff?: string
  matched_keywords?: string[]
  created_at: string
  url_name?: string
  url?: string
}

export function useApi() {
  const [urls, setUrls] = useState<MonitoredUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUrls = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/urls`)
      if (!response.ok) throw new Error('Failed to fetch URLs')
      const data = await response.json()
      setUrls(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUrls()
  }, [fetchUrls])

  const fetchChecks = async (urlId?: string, limit = 50): Promise<Check[]> => {
    try {
      const params = new URLSearchParams()
      if (urlId) params.append('url_id', urlId)
      params.append('limit', limit.toString())

      const response = await fetch(`${API_BASE}/api/checks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch checks')
      return await response.json()
    } catch (err) {
      console.error('Failed to fetch checks:', err)
      return []
    }
  }

  const fetchChanges = async (
    urlId?: string,
    priority?: string,
    limit = 50
  ): Promise<Change[]> => {
    try {
      const params = new URLSearchParams()
      if (urlId) params.append('url_id', urlId)
      if (priority) params.append('priority', priority)
      params.append('limit', limit.toString())

      const response = await fetch(`${API_BASE}/api/changes?${params}`)
      if (!response.ok) throw new Error('Failed to fetch changes')
      return await response.json()
    } catch (err) {
      console.error('Failed to fetch changes:', err)
      return []
    }
  }

  const createUrl = async (data: UrlCreateData): Promise<MonitoredUrl> => {
    const response = await fetch(`${API_BASE}/api/urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to create URL')
    }

    const newUrl = await response.json()
    setUrls(prev => [...prev, newUrl].sort((a, b) => a.name.localeCompare(b.name)))
    return newUrl
  }

  const updateUrl = async (id: string, data: UrlUpdateData): Promise<MonitoredUrl> => {
    const response = await fetch(`${API_BASE}/api/urls/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to update URL')
    }

    const updatedUrl = await response.json()
    setUrls(prev => prev.map(u => (u.id === id ? updatedUrl : u)))
    return updatedUrl
  }

  const deleteUrl = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/urls/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to delete URL')
    }

    setUrls(prev => prev.filter(u => u.id !== id))
  }

  const toggleUrl = async (id: string): Promise<{ enabled: boolean }> => {
    const response = await fetch(`${API_BASE}/api/urls/${id}/toggle`, {
      method: 'PATCH',
    })

    if (!response.ok) {
      throw new Error('Failed to toggle URL')
    }

    const result = await response.json()
    setUrls(prev => prev.map(u => (u.id === id ? { ...u, enabled: result.enabled } : u)))
    return result
  }

  return {
    urls,
    loading,
    error,
    fetchUrls,
    fetchChecks,
    fetchChanges,
    createUrl,
    updateUrl,
    deleteUrl,
    toggleUrl,
  }
}
