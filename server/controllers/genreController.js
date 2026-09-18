const genreService = require('../services/genreService')

async function getGenres(req, res, next) {
  const startedAt = Date.now()
  try {
    const result = await genreService.getGenres()
    console.log(`[genres] ${result.cacheHit ? 'cache-hit' : `${Date.now() - startedAt}ms`}`)
    return res.json({ genres: result.genres })
  } catch (error) {
    return next(error)
  }
}

module.exports = { getGenres }
