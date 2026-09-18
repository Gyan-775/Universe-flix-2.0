class MemoryCache {
  constructor() {
    this.entries = new Map()
  }

  get(key) {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key, value, ttlMs) {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs })
    return value
  }

  has(key) {
    return this.get(key) !== undefined
  }

  delete(key) {
    return this.entries.delete(key)
  }
}

const cache = new MemoryCache()
const inFlight = new Map()

async function cachedRequest(key, loader, ttlMs) {
  const cached = cache.get(key)
  if (cached !== undefined) return { value: cached, cacheHit: true }
  if (inFlight.has(key)) return { value: await inFlight.get(key), cacheHit: false }

  const request = Promise.resolve().then(loader).then((value) => {
    cache.set(key, value, ttlMs)
    return value
  }).finally(() => inFlight.delete(key))
  inFlight.set(key, request)
  return { value: await request, cacheHit: false }
}

module.exports = { cache, cachedRequest }
