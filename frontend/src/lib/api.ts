/**
 * Centralized API utilities for consistent data fetching.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Generic fetch function for API calls.
 *
 * @param endpoint - API endpoint (e.g., '/api/urls')
 * @param params - Optional query parameters
 * @returns Parsed JSON response
 * @throws ApiError on failure
 */
export async function fetchApi<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.detail || `Request failed with status ${response.status}`,
      response.status,
      errorData.detail
    )
  }

  return response.json()
}

/**
 * POST request to API.
 */
export async function postApi<T, D = unknown>(
  endpoint: string,
  data?: D
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.detail || `Request failed with status ${response.status}`,
      response.status,
      errorData.detail
    )
  }

  return response.json()
}

/**
 * PUT request to API.
 */
export async function putApi<T, D = unknown>(
  endpoint: string,
  data?: D
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.detail || `Request failed with status ${response.status}`,
      response.status,
      errorData.detail
    )
  }

  return response.json()
}

/**
 * PATCH request to API.
 */
export async function patchApi<T, D = unknown>(
  endpoint: string,
  data?: D
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.detail || `Request failed with status ${response.status}`,
      response.status,
      errorData.detail
    )
  }

  return response.json()
}

/**
 * DELETE request to API.
 */
export async function deleteApi<T = void>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.detail || `Request failed with status ${response.status}`,
      response.status,
      errorData.detail
    )
  }

  // Some DELETE endpoints don't return content
  const text = await response.text()
  return text ? JSON.parse(text) : ({} as T)
}

/**
 * Test diff request/response types.
 */
export interface TestDiffRequest {
  original_html: string
  new_html: string
}

export interface TestDiffResponse {
  has_changed: boolean
  type: string | null
  priority: 'INFO' | 'IMPORTANT' | 'CRITICAL'
  confidence: number
  description: string
  diff: string | null
  matched_keywords: string[] | null
}

/**
 * Test the diff logic with two HTML inputs.
 */
export async function testDiff(
  originalHtml: string,
  newHtml: string
): Promise<TestDiffResponse> {
  return postApi<TestDiffResponse, TestDiffRequest>('/api/test-diff', {
    original_html: originalHtml,
    new_html: newHtml,
  })
}

export { API_BASE }
