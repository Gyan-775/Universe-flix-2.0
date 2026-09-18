const universeService = require('../services/universeService')


async function getUniverses(req, res, next) {
  try {
    const startedAt = Date.now()
    const result = await universeService.getUniverses()

    const time = result.cacheHit
      ? 'cache-hit'
      : `${Date.now() - startedAt}ms`

    console.log(`[universes] ${time}`)

    return res.json({
      universes: result.universes,
    })
  } catch (error) {
    return next(error)
  }
}


async function getUniverseMovies(req, res, next) {
  try {
    const universe = await universeService.getUniverseBySlug(req.params.slug)

    if (!universe) {
      return res.status(404).json({
        error: 'Universe not configured',
        slug: req.params.slug,
      })
    }

    const page = Number.parseInt(req.query.page || '1', 10)
    const limit = Number.parseInt(req.query.limit || '20', 10)

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 500 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 24
    ) {
      return res.status(400).json({
        error: 'page must be positive and limit must be between 1 and 24',
      })
    }

    const membershipType =
      req.query.membershipType === 'all' ? 'all' : 'primary'

    const result = await universeService.getUniverseMovies(
      req.params.slug,
      {
        page,
        limit,
        genre: req.query.genre,
        membershipType,
      }
    )

    console.log(
      `[universe:${req.params.slug}] ` +
      `raw=${result.diagnostics.counts.raw} ` +
      `unique=${result.diagnostics.counts.afterDedup} ` +
      `primary=${result.diagnostics.counts.primary} ` +
      `auxiliary=${result.diagnostics.counts.auxiliary}`
    )

    return res.json({
      universe,
      movies: result.movies,
      page: result.page,
      totalPages: result.totalPages,
      totalResults: result.totalResults,
      sort: result.sort,
      membershipType,
    })
  } catch (error) {
    if (
      error.code === 'UNIVERSE_NOT_CONFIGURED' ||
      error.code === 'UNIVERSE_MEMBERSHIP_NOT_CONFIGURED'
    ) {
      return res.status(error.status || 404).json({
        error: error.message,
        slug: error.slug || req.params.slug,
      })
    }

    return next(error)
  }
}


async function debugUniverse(req, res, next) {
  try {
    const result = await universeService.getUniverseMovies(
      req.params.slug,
      {
        page: 1,
        limit: 1,
        membershipType: 'all',
      }
    )

    return res.json(result.diagnostics)
  } catch (error) {
    return next(error)
  }
}


async function searchUniverseMovies(req, res, next) {
  const query = String(req.query.q || '').trim()

  if (query.length < 2) {
    return res.status(400).json({
      error: 'q must contain at least 2 characters',
    })
  }

  try {
    const universe = await universeService.getUniverseBySlug(
      req.params.slug
    )

    if (!universe) {
      return res.status(404).json({
        error: 'Universe not configured',
        slug: req.params.slug,
      })
    }

    const page = Number.parseInt(req.query.page || '1', 10)

    const result = await universeService.searchUniverseMovies(
      req.params.slug,
      query,
      {
        page,
        limit: 24,
        genre: req.query.genre,
      }
    )

    return res.json({
      universe,
      movies: result.movies,
      page: result.page,
      totalPages: result.totalPages,
      totalResults: result.totalResults,
      sort: 'releaseDate.desc',
    })
  } catch (error) {
    if (
      error.code === 'UNIVERSE_NOT_CONFIGURED' ||
      error.code === 'UNIVERSE_MEMBERSHIP_NOT_CONFIGURED'
    ) {
      return res.status(error.status || 404).json({
        error: error.message,
        slug: error.slug || req.params.slug,
      })
    }

    return next(error)
  }
}


module.exports = {
  getUniverses,
  getUniverseMovies,
  searchUniverseMovies,
  debugUniverse,
}