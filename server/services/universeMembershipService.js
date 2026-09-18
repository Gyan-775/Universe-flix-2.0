const { universeConfig } = require('../config/universes')
const { cachedRequest } = require('./cacheService')
const tmdbService = require('./tmdbService')
const { normalizeMovie } = require('../utils/normalizeMovie')

const MEMBERSHIP_TTL = 10 * 60 * 1000

function findUniverse(slug) {
  const universe = universeConfig.find((item) => item.slug === slug)
  if (!universe) {
    const error = new Error('Universe not configured')
    error.code = 'UNIVERSE_NOT_CONFIGURED'
    error.status = 404
    error.slug = slug
    throw error
  }
  return universe
}

function compareMovies(left, right) {
  return (right.releaseDate || '').localeCompare(left.releaseDate || '')
    || String(left.title || '').localeCompare(String(right.title || ''))
}

function movieWithMembership(movie, universe, membershipType) {
  return normalizeMovie({
    ...movie,
    universe: { id: universe.id, slug: universe.slug, name: universe.name, type: universe.type },
    membershipType,
  })
}

async function resolveMovieMembership(movie, universe, membershipType = 'auxiliary') {
  const configured = findUniverse(universe.slug || universe)
  const primaryIds = new Set((configured.explicitPrimaryMovieIds || []).map(Number))
  return {
    movieId: movie.id,
    universeId: configured.id,
    membershipType: primaryIds.has(Number(movie.id)) ? 'primary' : membershipType,
    source: primaryIds.has(Number(movie.id)) ? 'explicit' : 'provider',
    confidence: primaryIds.has(Number(movie.id)) ? 1 : 0.6,
  }
}

async function resolveUniverseMembership(universe, membershipType = 'primary') {
  const configured = findUniverse(universe.slug || universe)
  const key = `universe-membership:${configured.slug}:${membershipType}`
  const result = await cachedRequest(key, async () => {
    const sources = { collections: [], companies: [], keywords: [], explicit: [] }
    const records = new Map()
    const primaryIds = new Set((configured.explicitPrimaryMovieIds || []).map(Number))

    if (primaryIds.size) {
      const explicitMovies = await Promise.all([...primaryIds].map((id) => tmdbService.getMovieSummary(id)))
      explicitMovies.forEach((movie) => {
        if (movie?.id) {
          records.set(movie.id, { movie, membershipType: 'primary', source: 'explicit', confidence: 1 })
          sources.explicit.push(movie.id)
        }
      })
    }

    for (const collectionId of configured.tmdbCollectionIds || []) {
        const collection = await tmdbService.getCollectionDetails(collectionId)
        ;(collection.parts || []).forEach((movie) => {
          if (movie.id && !records.has(movie.id)) records.set(movie.id, { movie, membershipType: primaryIds.size ? 'auxiliary' : 'primary', source: 'collection', confidence: 0.8 })
          sources.collections.push(...(collection.parts || []).map((item) => item.id).filter(Boolean))
        })
    }

    if (membershipType === 'all') {
      for (const companyId of configured.tmdbCompanyIds || []) {
        const data = await tmdbService.discoverMovies({ page: 1, sort_by: 'primary_release_date.desc', with_companies: companyId })
        sources.companies.push(...(data.results || []).map((item) => item.id).filter(Boolean))
        ;(data.results || []).forEach((movie) => {
          if (movie.id && !records.has(movie.id)) records.set(movie.id, { movie, membershipType: 'auxiliary', source: 'company', confidence: 0.55 })
        })
      }
    }

    const allRecords = [...records.values()]
    const primary = allRecords.filter((record) => record.membershipType === 'primary')
    const auxiliary = allRecords.filter((record) => record.membershipType !== 'primary')
    const diagnostics = {
      sources: {
        collections: [...new Set(sources.collections)],
        companies: [...new Set(sources.companies)],
        keywords: [...new Set(sources.keywords)],
        explicit: [...new Set(sources.explicit)],
      },
      counts: { raw: sources.collections.length + sources.companies.length + sources.keywords.length + sources.explicit.length, afterDedup: records.size, primary: primary.length, auxiliary: auxiliary.length },
      duplicatesRemoved: (sources.collections.length + sources.companies.length + sources.keywords.length + sources.explicit.length) - records.size,
    }
    return { records, diagnostics }
  }, MEMBERSHIP_TTL)

  const selected = membershipType === 'all'
    ? [...result.value.records.values()]
    : [...result.value.records.values()].filter((record) => record.membershipType === 'primary')
  return { ...result.value, records: selected, cacheHit: result.cacheHit }
}

async function getUniverseMovieIds(slug, membershipType = 'primary') {
  const result = await resolveUniverseMembership(slug, membershipType)
  return result.records.map((record) => record.movie.id)
}

async function getUniverseMovies(slug, options = {}) {
  const membershipType = options.membershipType || 'primary'
  const universe = findUniverse(slug)
  const result = await resolveUniverseMembership(universe, membershipType)
  const genreName = options.genre?.toLowerCase()
  const offset = ((options.page || 1) - 1) * (options.limit || 24)
  const filtered = result.records
    .map((record) => movieWithMembership(record.movie, universe, record.membershipType))
    .filter((movie) => !options.textQuery || `${movie.title || ''} ${movie.overview || ''}`.toLowerCase().includes(options.textQuery.toLowerCase()))
    .filter((movie) => !genreName || movie.genres.some((genre) => genre.toLowerCase() === genreName))
    .sort(compareMovies)
  const limit = options.limit || 24
  return {
    universe,
    movies: filtered.slice(offset, offset + limit),
    page: options.page || 1,
    totalPages: Math.ceil(filtered.length / limit),
    totalResults: filtered.length,
    sort: 'releaseDate.desc',
    membershipType,
    diagnostics: result.diagnostics,
    cacheHit: result.cacheHit,
  }
}
async function findUniverseForMovie(movieId) {
  const id = Number(movieId)

  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  for (const universe of universeConfig) {
    // Check explicitly configured primary movies first.
    const primaryIds = new Set(
      (universe.explicitPrimaryMovieIds || []).map(Number)
    )

    if (primaryIds.has(id)) {
      return universe
    }

    // Check verified TMDB collections.
    for (const collectionId of universe.tmdbCollectionIds || []) {
      const collection = await tmdbService.getCollectionDetails(collectionId)

      const belongsToCollection = (collection.parts || []).some(
        (movie) => Number(movie.id) === id
      )

      if (belongsToCollection) {
        return universe
      }
    }
  }

  return null
}
module.exports = {
  resolveMovieMembership,
  getUniverseMovieIds,
  getUniverseMovies,
  findUniverseForMovie,
}