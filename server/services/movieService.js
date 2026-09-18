const tmdbService = require('./tmdbService')
const { normalizeMovie } = require('../utils/normalizeMovie')
const { cachedRequest } = require('./cacheService')
const { universeConfig } = require('../config/universes')

const CACHE_TTL = 45 * 1000

async function getGenreMap() {
  const result = await cachedRequest('genres:movie', () => tmdbService.getGenres(), 10 * 60 * 1000)
  return Object.fromEntries((result.value.genres || []).map((genre) => [genre.id, genre.name]))
}

function withGenreMap(movie, genreMap) {
  return { ...movie, genreMap }
}

function withUniverse(movie, definition) {
  return { ...movie, universe: { id: definition.id, slug: definition.slug, name: definition.name, type: definition.type } }
}

function buildDiscoverParams(query = {}, genreMap = {}) {
  const params = {}
  if (query.genre) params.with_genres = /^\d+$/.test(String(query.genre)) ? query.genre : Object.entries(genreMap).find(([, name]) => name.toLowerCase() === String(query.genre).toLowerCase())?.[0]
  if (query.year) params.primary_release_year = query.year
  if (query.rating) params['vote_average.gte'] = query.rating
  if (query.runtimeMin) params['with_runtime.gte'] = query.runtimeMin
  if (query.runtimeMax) params['with_runtime.lte'] = query.runtimeMax
  if (query.textQuery) params.with_text_query = query.textQuery
  if (query.universe) {
    const definition = universeConfig.find((universe) => universe.slug === query.universe || universe.id === query.universe)
    if (!definition) {
      const error = new Error('Universe not configured')
      error.code = 'UNIVERSE_NOT_CONFIGURED'
      error.status = 404
      error.slug = query.universe
      throw error
    }
    if (definition?.tmdbCollectionIds?.length) params.with_collections = definition.tmdbCollectionIds.join('|')
    if (definition?.tmdbCompanyIds?.length) params.with_companies = definition.tmdbCompanyIds.join('|')
    if (definition?.tmdbKeywordIds?.length) params.with_keywords = definition.tmdbKeywordIds.join('|')
    if (!params.with_collections && !params.with_companies && !params.with_keywords) {
      const error = new Error('Universe membership is not configured')
      error.code = 'UNIVERSE_MEMBERSHIP_NOT_CONFIGURED'
      error.status = 422
      error.slug = definition.slug
      throw error
    }
  }
  return params
}

async function getMovies(options = {}) {
  const page = options.page || 1
  const limit = options.limit || 20
  const fetchedGenreMap = await getGenreMap()
  const params = buildDiscoverParams(options, fetchedGenreMap)
  const key = `movies:${page}:${limit}:${JSON.stringify(params)}`
  const result = await cachedRequest(key, async () => {
    const offset = (page - 1) * limit
    const firstTmdbPage = Math.floor(offset / 20) + 1
    const pagesNeeded = Math.ceil(((offset % 20) + limit) / 20)
    const [pages] = await Promise.all([
      Promise.all(Array.from({ length: pagesNeeded }, (_, index) => tmdbService.discoverMovies({ page: firstTmdbPage + index, sort_by: 'primary_release_date.desc', ...params }))),
    ])
    const firstPage = pages[0] || {}
    const results = pages.flatMap((data) => data.results || []).slice(offset % 20, (offset % 20) + limit)
    return {
      movies: results.map((movie) => normalizeMovie(withGenreMap(movie, fetchedGenreMap))).sort(compareMovies),
      page,
      totalPages: Math.ceil((firstPage.total_results || 0) / limit),
      totalResults: firstPage.total_results ?? 0,
    }
  }, CACHE_TTL)
  return { ...result.value, cacheHit: result.cacheHit }
}

async function getMovieById(id) {
  const result = await cachedRequest(`movie:${id}`, () => tmdbService.getMovieDetails(id).then(normalizeMovie), 5 * 60 * 1000)
  return { movie: result.value, cacheHit: result.cacheHit }
}

async function getSimilarMovies(id) {
  const result = await cachedRequest(`similar:${id}`, async () => {
    const [data, genreMap] = await Promise.all([tmdbService.getSimilarMovies(id), getGenreMap()])
    return (data.results || []).slice(0, 12).map((movie) => normalizeMovie(withGenreMap(movie, genreMap)))
  }, 5 * 60 * 1000)
  return { movies: result.value, cacheHit: result.cacheHit }
}

async function searchMovies(query, page = 1) {
  const normalizedQuery = query.trim().toLowerCase()
  const key = `search:${normalizedQuery}:${page}`
  const result = await cachedRequest(key, async () => {
    const [data, genreMap] = await Promise.all([tmdbService.searchMovies(normalizedQuery, page), getGenreMap()])
    return {
      movies: (data.results || []).map((movie) => normalizeMovie(withGenreMap(movie, genreMap))).sort(compareMovies),
      page: data.page ?? page,
      totalPages: data.total_pages ?? 0,
      totalResults: data.total_results ?? 0,
    }
  }, CACHE_TTL)
  return { ...result.value, cacheHit: result.cacheHit }
}

async function getFeaturedMovie() {
  const result = await cachedRequest('movie:featured', async () => {
    const [data, genreMap] = await Promise.all([
      tmdbService.discoverMovies({ page: 1, sort_by: 'primary_release_date.desc', 'vote_count.gte': 50 }),
      getGenreMap(),
    ])
    const movie = data.results?.[0]
    return movie ? normalizeMovie(withGenreMap(movie, genreMap)) : null
  }, 60 * 1000)
  return { movie: result.value, cacheHit: result.cacheHit }
}

function compareMovies(left, right) {
  const leftDate = left.releaseDate || ''
  const rightDate = right.releaseDate || ''
  return rightDate.localeCompare(leftDate) || String(left.title || '').localeCompare(String(right.title || ''))
}

async function getUniverseMovies(slug, options = {}) {
  const definition = universeConfig.find((universe) => universe.slug === slug)
  if (!definition) {
    const error = new Error('Universe not configured')
    error.code = 'UNIVERSE_NOT_CONFIGURED'
    error.status = 404
    error.slug = slug
    throw error
  }
  if (!definition.tmdbCollectionIds?.length && !definition.tmdbCompanyIds?.length && !definition.tmdbKeywordIds?.length) {
    const error = new Error('Universe membership is not configured')
    error.code = 'UNIVERSE_MEMBERSHIP_NOT_CONFIGURED'
    error.status = 422
    error.slug = slug
    throw error
  }

  const page = options.page || 1
  const limit = options.limit || 24
  const cacheKey = `universe:${slug}:${page}:${limit}:${options.genre || ''}:${options.year || ''}:${options.rating || ''}:${options.textQuery || ''}`
  const result = await cachedRequest(cacheKey, async () => {
    const [genreMap] = await Promise.all([getGenreMap()])
    const uniqueMovies = new Map()
    const genreId = options.genre && (/^\d+$/.test(String(options.genre)) ? String(options.genre) : Object.entries(genreMap).find(([, name]) => name.toLowerCase() === String(options.genre).toLowerCase())?.[0])
    const offset = (page - 1) * limit
    let sourceMovies = []
    let sourceTotal = 0
    if (definition.tmdbCollectionIds?.length) {
      const collections = await Promise.all(definition.tmdbCollectionIds.map((id) => tmdbService.getCollectionDetails(id)))
      collections.flatMap((collection) => collection.parts || []).forEach((movie) => {
        if (movie.id) uniqueMovies.set(movie.id, movie)
      })
      sourceMovies = [...uniqueMovies.values()]
      sourceTotal = sourceMovies.length
    } else {
      const firstTmdbPage = 1
      const pagesNeeded = Math.ceil((offset + limit) / 20)
      const discoverParams = {
        page: firstTmdbPage,
        sort_by: 'primary_release_date.desc',
        with_companies: definition.tmdbCompanyIds?.join('|'),
        with_keywords: definition.tmdbKeywordIds?.join('|'),
        ...(genreId ? { with_genres: genreId } : {}),
        ...(options.year ? { primary_release_year: options.year } : {}),
        ...(options.rating ? { 'vote_average.gte': options.rating } : {}),
        ...(options.textQuery ? { with_text_query: options.textQuery } : {}),
      }
      const pages = await Promise.all(Array.from({ length: pagesNeeded }, (_, index) => tmdbService.discoverMovies({ ...discoverParams, page: firstTmdbPage + index })))
      sourceMovies = pages.flatMap((data) => data.results || [])
      sourceTotal = pages[0]?.total_results || 0
    }
    const filtered = sourceMovies
      .filter((movie) => !options.textQuery || `${movie.title || ''} ${movie.overview || ''}`.toLowerCase().includes(String(options.textQuery).toLowerCase()))
      .filter((movie) => !genreId || movie.genre_ids?.includes(Number(genreId)))
      .filter((movie) => !options.year || String(movie.release_date || '').startsWith(String(options.year)))
      .filter((movie) => !options.rating || Number(movie.vote_average || 0) >= Number(options.rating))
      .map((movie) => normalizeMovie(withUniverse(withGenreMap(movie, genreMap), definition)))
      .sort(compareMovies)
    return {
      movies: filtered.slice(offset, offset + limit),
      page,
      totalPages: definition.tmdbCollectionIds?.length ? Math.ceil(filtered.length / limit) : Math.ceil(sourceTotal / limit),
      totalResults: definition.tmdbCollectionIds?.length ? filtered.length : sourceTotal,
    }
  }, 60 * 1000)
  return { ...result.value, cacheHit: result.cacheHit }
}

async function searchUniverseMovies(slug, query, options = {}) {
  const definition = universeConfig.find((universe) => universe.slug === slug)
  if (!definition) {
    const error = new Error('Universe not configured')
    error.code = 'UNIVERSE_NOT_CONFIGURED'
    error.status = 404
    error.slug = slug
    throw error
  }
  return getUniverseMovies(definition.slug, { ...options, textQuery: query })
}

module.exports = { getMovies, getMovieById, getSimilarMovies, searchMovies, getFeaturedMovie, getUniverseMovies, searchUniverseMovies }
