const homeService = require('../services/homeService')

function page(value) {
  const parsed = Number.parseInt(value || '1', 10)
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 500 ? parsed : null
}

function limit(value) {
  const parsed = Number.parseInt(value || '20', 10)
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 20 ? parsed : null
}

function run(label, loader, req, res, next) {
  const startedAt = Date.now()
  loader().then((result) => {
    console.log(`[${label}] ${result.cacheHit ? 'cache-hit' : `${Date.now() - startedAt}ms`}`)
    res.json(result)
  }).catch(next)
}

async function getHome(req, res, next) {
  try { return res.json(await homeService.getHomepage()) } catch (error) { return next(error) }
}

function getLatest(req, res, next) {
  const currentPage = page(req.query.page); const currentLimit = limit(req.query.limit)
  if (!currentPage || !currentLimit) return res.status(400).json({ error: 'page must be 1-500 and limit must be 1-20' })
  return run('home/latest', () => homeService.getLatest(currentPage, currentLimit), req, res, next)
}

function getPopular(req, res, next) {
  const currentPage = page(req.query.page); const currentLimit = limit(req.query.limit)
  if (!currentPage || !currentLimit) return res.status(400).json({ error: 'page must be 1-500 and limit must be 1-20' })
  return run('home/popular', () => homeService.getPopular(currentPage, currentLimit), req, res, next)
}

function getTrending(req, res, next) {
  const currentPage = page(req.query.page); const currentLimit = limit(req.query.limit); const window = req.query.window === 'day' ? 'day' : 'week'
  if (!currentPage || !currentLimit) return res.status(400).json({ error: 'page must be 1-500 and limit must be 1-20' })
  return run('home/trending', () => homeService.getTrending(window, currentPage, currentLimit), req, res, next)
}

function getTopRated(req, res, next) {
  const currentPage = page(req.query.page); const currentLimit = limit(req.query.limit)
  if (!currentPage || !currentLimit) return res.status(400).json({ error: 'page must be 1-500 and limit must be 1-20' })
  return run('home/top-rated', () => homeService.getTopRated(currentPage, currentLimit), req, res, next)
}

function getUpcoming(req, res, next) {
  const currentPage = page(req.query.page); const currentLimit = limit(req.query.limit)
  if (!currentPage || !currentLimit) return res.status(400).json({ error: 'page must be 1-500 and limit must be 1-20' })
  return run('home/upcoming', () => homeService.getUpcoming(currentPage, currentLimit), req, res, next)
}

module.exports = { getHome, getLatest, getPopular, getTrending, getTopRated, getUpcoming }