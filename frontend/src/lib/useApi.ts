import { useState, useEffect, useCallback } from 'react'
import { fetchApi, postApi, putApi, patchApi, deleteApi } from './api'

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
      const data = await fetchApi<MonitoredUrl[]>('/api/urls')
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
      return await fetchApi<Check[]>('/api/checks', { url_id: urlId, limit })
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
      return await fetchApi<Change[]>('/api/changes', { url_id: urlId, priority, limit })
    } catch (err) {
      console.error('Failed to fetch changes:', err)
      return []
    }
  }

  const createUrl = async (data: UrlCreateData): Promise<MonitoredUrl> => {
    const newUrl = await postApi<MonitoredUrl, UrlCreateData>('/api/urls', data)
    setUrls(prev => [...prev, newUrl].sort((a, b) => a.name.localeCompare(b.name)))
    return newUrl
  }

  const updateUrl = async (id: string, data: UrlUpdateData): Promise<MonitoredUrl> => {
    const updatedUrl = await putApi<MonitoredUrl, UrlUpdateData>(`/api/urls/${id}`, data)
    setUrls(prev => prev.map(u => (u.id === id ? updatedUrl : u)))
    return updatedUrl
  }

  const deleteUrlFn = async (id: string): Promise<void> => {
    await deleteApi(`/api/urls/${id}`)
    setUrls(prev => prev.filter(u => u.id !== id))
  }

  const toggleUrl = async (id: string): Promise<{ enabled: boolean }> => {
    const result = await patchApi<{ enabled: boolean }>(`/api/urls/${id}/toggle`)
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
    deleteUrl: deleteUrlFn,
    toggleUrl,
  }
}
