const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'https://universe-flix-2-0.onrender.com/api')
const MAX_RETRIES = 3
const RETRY_DELAYS = [500, 1500, 3000]

function waitForRetry(delay, signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, delay)
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(new DOMException('The request was aborted', 'AbortError'))
    }, { once: true })
  })
}

export async function request(path, options = {}) {
  const { signal, timeout: requestTimeout = 10000, ...requestOptions } = options

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    if (signal?.aborted) throw new DOMException('The request was aborted', 'AbortError')

    const controller = new AbortController()
    const onAbort = () => controller.abort()
    const timeout = window.setTimeout(() => controller.abort(), requestTimeout)
    signal?.addEventListener('abort', onAbort, { once: true })

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...requestOptions.headers,
        },
      })

      if (!response.ok) {
        let details = null
        try { details = await response.json() } catch { details = null }
        const error = new Error(details?.error || `API request failed with ${response.status}`)
        error.status = response.status
        error.details = details
        if (response.status < 500 || attempt === MAX_RETRIES) throw error
        await waitForRetry(RETRY_DELAYS[attempt], signal)
        continue
      }

      return await response.json()
    } catch (error) {
      if (signal?.aborted || error.name !== 'AbortError' && error.status && error.status < 500 || attempt === MAX_RETRIES) throw error
      await waitForRetry(RETRY_DELAYS[attempt], signal)
    } finally {
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
    }
  }
}

export { API_BASE_URL }
