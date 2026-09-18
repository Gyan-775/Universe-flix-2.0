import { request } from './api'

export async function ensureAnonymousSession() {
  try {
    return await request('/session', { method: 'GET' })
  } catch (error) {
    const key = 'universeflix_anonymous_session'
    let sessionId = localStorage.getItem(key)
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem(key, sessionId)
    }
    return { sessionId, anonymous: true, localOnly: true, error }
  }
}

export async function saveTasteProfile(profile) {
  localStorage.setItem('universeflix_taste', JSON.stringify(profile))
  try { return await request('/session/taste', { method: 'POST', body: JSON.stringify({ profile }) }) } catch { return { profile, localOnly: true } }
}

export async function recordInteraction(eventType, movieId, payload = {}) {
  try { return await request('/session/interaction', { method: 'POST', body: JSON.stringify({ eventType, movieId, payload }) }) } catch { return { ok: false, localOnly: true } }
}
