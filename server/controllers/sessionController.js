const sessionService = require('../services/sessionService')

async function createSession(req, res, next) {
  try { return res.status(201).json({ sessionId: await sessionService.ensureSession(req, res), anonymous: true }) } catch (error) { return next(error) }
}

async function getSession(req, res, next) {
  try { return res.json({ sessionId: await sessionService.ensureSession(req, res), anonymous: true }) } catch (error) { return next(error) }
}

async function getProfile(req, res, next) {
  try { const id = await sessionService.ensureSession(req, res); return res.json({ sessionId: id, profile: await sessionService.getProfile(id) }) } catch (error) { return next(error) }
}

async function saveTaste(req, res, next) {
  try { const id = await sessionService.ensureSession(req, res); return res.json({ profile: await sessionService.saveTaste(id, req.body?.profile || {}) }) } catch (error) { return next(error) }
}

async function interaction(req, res, next) {
  const allowed = ['movie_view', 'movie_click', 'movie_like', 'movie_dislike', 'quiz_completed', 'ai_query', 'universe_view', 'trailer_open', 'watch_order_open']
  if (!allowed.includes(req.body?.eventType)) return res.status(400).json({ error: 'Unsupported interaction event' })
  try { const id = await sessionService.ensureSession(req, res); await sessionService.recordInteraction(id, req.body.eventType, req.body.movieId, req.body.payload); return res.status(201).json({ ok: true }) } catch (error) { return next(error) }
}

module.exports = { createSession, getSession, getProfile, saveTaste, interaction }
