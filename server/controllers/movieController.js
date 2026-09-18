const movieService = require('../services/movieService')

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10)
  return Number.isInteger(page) && page > 0 && page <= 500 ? page : null
}

function parseOptionalNumber(value, name, min, max) {
  if (value === undefined || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    const error = new Error(`${name} must be between ${min} and ${max}`)
    error.status = 400
    throw error
  }
  return parsed
}

async function getMovies(req, res, next) {
  const page = parsePage(req.query.page)
  if (!page) return res.status(400).json({ error: 'page must be an integer between 1 and 500' })
  let filters
  try {
    const limit = parseOptionalNumber(req.query.limit, 'limit', 1, 24) || 20
    filters = {
      page,
      limit,
      genre: req.query.genre,
      year: parseOptionalNumber(req.query.year, 'year', 1870, 2100),
      rating: parseOptionalNumber(req.query.rating, 'rating', 0, 10),
      runtimeMin: parseOptionalNumber(req.query.runtimeMin, 'runtimeMin', 0, 1000),
      runtimeMax: parseOptionalNumber(req.query.runtimeMax, 'runtimeMax', 0, 1000),
      universe: req.query.universe,
    }
  } catch (error) {
    return next(error)
  }

  try {
    const startedAt = Date.now()
    const result = await movieService.getMovies(filters)
    console.log(`[movies] ${result.cacheHit ? 'cache-hit' : `${Date.now() - startedAt}ms`}`)
    return res.json({ movies: result.movies, page: result.page, totalPages: result.totalPages, totalResults: result.totalResults, sort: 'releaseDate.desc' })
  } catch (error) {
    return next(error)
  }
}

async function getMovieById(req, res, next) {
  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'movie id must be a positive integer' })

  try {
    const startedAt = Date.now()
    const result = await movieService.getMovieById(id)
    console.log(`[movie] ${result.cacheHit ? 'cache-hit' : `${Date.now() - startedAt}ms`}`)
    return res.json(result.movie)
  } catch (error) {
    return next(error)
  }
}

async function getSimilarMovies(req, res, next) {
  const id = Number.parseInt(req.params.id, 10)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'movie id must be a positive integer' })
  try {
    const result = await movieService.getSimilarMovies(id)
    return res.json({ movies: result.movies })
  } catch (error) {
    return next(error)
  }
}

async function searchMovies(req, res, next) {
  const query = String(req.query.q || '').trim()
  const page = parsePage(req.query.page)
  if (query.length < 2) return res.status(400).json({ error: 'q must contain at least 2 characters' })
  if (!page) return res.status(400).json({ error: 'page must be an integer between 1 and 500' })

  try {
    const startedAt = Date.now()
    const result = await movieService.searchMovies(query, page)
    console.log(`[search] ${result.cacheHit ? 'cache-hit' : `${Date.now() - startedAt}ms`}`)
    return res.json({ movies: result.movies, page: result.page, totalPages: result.totalPages, totalResults: result.totalResults, sort: 'releaseDate.desc' })
  } catch (error) {
    return next(error)
  }
}

async function getFeaturedMovie(req, res, next) {
  try {
    const startedAt = Date.now()
    const result = await movieService.getFeaturedMovie()
    console.log(`[featured] ${result.cacheHit ? 'cache-hit' : `${Date.now() - startedAt}ms`}`)
    if (!result.movie) return res.status(404).json({ error: 'No featured movie available' })
    return res.json(result.movie)
  } catch (error) {
    return next(error)
  }
}

module.exports = { getMovies, getMovieById, getSimilarMovies, searchMovies, getFeaturedMovie }
