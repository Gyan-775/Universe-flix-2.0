const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function request(path, options = {}) {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  const timeout = window.setTimeout(() => controller.abort(), options.timeout || 10000)
  options.signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      let details = null
      try { details = await response.json() } catch { details = null }
      const error = new Error(details?.error || `API request failed with ${response.status}`)
      error.status = response.status
      error.details = details
      throw error
    }

    return await response.json()
  } finally {
    window.clearTimeout(timeout)
    options.signal?.removeEventListener('abort', onAbort)
  }
}

export { API_BASE_URL }
