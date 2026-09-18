const crypto = require('crypto')
const { query } = require('../db')
const memorySessions = new Map()

function readSessionId(req) {
  const cookie = req.headers.cookie?.split(';').map((item) => item.trim()).find((item) => item.startsWith('universe_session='))
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : req.headers['x-anonymous-session']
}

function setSessionCookie(res, id) {
  res.setHeader('Set-Cookie', `universe_session=${encodeURIComponent(id)}; Max-Age=31536000; Path=/; SameSite=Lax`)
}

async function ensureSession(req, res) {
  let id = readSessionId(req)
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) id = crypto.randomUUID()
  setSessionCookie(res, id)
  try {
    await query('INSERT INTO anonymous_sessions (id) VALUES ($1) ON CONFLICT (id) DO UPDATE SET last_seen_at = NOW()', [id])
  } catch (error) {
    if (error.code !== 'DATABASE_NOT_CONFIGURED') throw error
    if (!memorySessions.has(id)) memorySessions.set(id, { profile: {}, interactions: [] })
  }
  return id
}

async function getProfile(sessionId) {
  try {
    const result = await query('SELECT profile FROM anonymous_taste_profiles WHERE session_id = $1', [sessionId])
    return result.rows[0]?.profile || {}
  } catch (error) {
    if (error.code !== 'DATABASE_NOT_CONFIGURED') throw error
    return memorySessions.get(sessionId)?.profile || {}
  }
}

async function saveTaste(sessionId, profile) {
  try {
    await query('INSERT INTO anonymous_taste_profiles (session_id, profile) VALUES ($1, $2) ON CONFLICT (session_id) DO UPDATE SET profile = EXCLUDED.profile, updated_at = NOW()', [sessionId, JSON.stringify(profile)])
  } catch (error) {
    if (error.code !== 'DATABASE_NOT_CONFIGURED') throw error
    if (!memorySessions.has(sessionId)) memorySessions.set(sessionId, { profile: {}, interactions: [] })
    memorySessions.get(sessionId).profile = profile
  }
  return profile
}

async function recordInteraction(sessionId, eventType, movieId, payload = {}) {
  try {
    await query('INSERT INTO anonymous_interactions (session_id, event_type, movie_id, payload) VALUES ($1, $2, $3, $4)', [sessionId, eventType, movieId || null, JSON.stringify(payload)])
  } catch (error) {
    if (error.code !== 'DATABASE_NOT_CONFIGURED') throw error
    if (!memorySessions.has(sessionId)) memorySessions.set(sessionId, { profile: {}, interactions: [] })
    memorySessions.get(sessionId).interactions.push({ eventType, movieId, payload, createdAt: new Date().toISOString() })
  }
}

module.exports = { readSessionId, ensureSession, getProfile, saveTaste, recordInteraction }
