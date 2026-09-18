const tmdbService = require('./tmdbService')
const { cachedRequest } = require('./cacheService')
const { normalizeMovie } = require('../utils/normalizeMovie')
const { universeConfig } = require('../config/universes')

const TTL = {
  featured: 10 * 60 * 1000,
  latest: 10 * 60 * 1000,
  popular: 10 * 60 * 1000,
  trending: 3 * 60 * 1000,
  topRated: 45 * 60 * 1000,
  upcoming: 20 * 60 * 1000,
}

async function getGenreMap() {
  const result = await cachedRequest('genres:movie', () => tmdbService.getGenres(), 10 * 60 * 1000)
  return Object.fromEntries((result.value.genres || []).map((genre) => [genre.id, genre.name]))
}

function normalizeList(data, genreMap) {
  return (data.results || []).map((movie) => normalizeMovie({ ...movie, genreMap }))
}

function pageResult(movies, data, page, limit, predicate = () => true) {
  const sorted = movies.filter((movie) => movie.releaseDate && predicate(movie)).sort((left, right) => (right.releaseDate || '').localeCompare(left.releaseDate || '') || String(left.title || '').localeCompare(String(right.title || '')))
  return {
    movies: sorted.slice(0, limit),
    page: data.page ?? page,
    totalPages: data.total_pages ?? Math.ceil((data.total_results || sorted.length) / limit),
    totalResults: data.total_results ?? sorted.length,
    sort: 'releaseDate.desc',
  }
}

async function getLatest(page = 1, limit = 20) {
  const key = `home:latest:${page}:${limit}`
  const result = await cachedRequest(key, async () => {
    const today = new Date().toISOString().slice(0, 10)
    const [data, genreMap] = await Promise.all([
      tmdbService.discoverMovies({ page, sort_by: 'primary_release_date.desc', 'primary_release_date.lte': today, 'vote_count.gte': 5 }),
      getGenreMap(),
    ])
    return pageResult(normalizeList(data, genreMap), data, page, limit, (movie) => movie.releaseDate <= today)
  }, TTL.latest)
  return { ...result.value, cacheHit: result.cacheHit }
}

async function getPopular(page = 1, limit = 20) {
  const key = `home:popular:${page}:${limit}`
  const result = await cachedRequest(key, async () => {
    const [data, genreMap] = await Promise.all([tmdbService.getPopularMovies(page), getGenreMap()])
    return { movies: normalizeList(data, genreMap).slice(0, limit), page: data.page ?? page, totalPages: data.total_pages ?? 0, totalResults: data.total_results ?? 0, sort: 'popularity.desc' }
  }, TTL.popular)
  return { ...result.value, cacheHit: result.cacheHit }
}

async function getTrending(window = 'week', page = 1, limit = 20) {
  const key = `home:trending:${window}:${page}:${limit}`
  const result = await cachedRequest(key, async () => {
    const [data, genreMap] = await Promise.all([tmdbService.getTrending(window), getGenreMap()])
    return { movies: normalizeList(data, genreMap).slice(0, limit), page, totalPages: 1, totalResults: data.total_results ?? data.results?.length ?? 0, sort: 'trending' }
  }, TTL.trending)
  return { ...result.value, cacheHit: result.cacheHit }
}

async function getTopRated(page = 1, limit = 20) {
  const key = `home:top-rated:${page}:${limit}`
  const result = await cachedRequest(key, async () => {
    const [data, genreMap] = await Promise.all([tmdbService.getTopRated(page), getGenreMap()])
    const movies = normalizeList(data, genreMap).filter((movie) => Number(movie.vote_count || movie.voteCount || 0) >= 100)
    return { movies: movies.slice(0, limit), page: data.page ?? page, totalPages: data.total_pages ?? 0, totalResults: data.total_results ?? 0, sort: 'vote_average.desc' }
  }, TTL.topRated)
  return { ...result.value, cacheHit: result.cacheHit }
}

async function getUpcoming(page = 1, limit = 20) {
  const key = `home:upcoming:${page}:${limit}`
  const result = await cachedRequest(key, async () => {
    const [data, genreMap] = await Promise.all([tmdbService.getUpcoming(page), getGenreMap()])
    const today = new Date().toISOString().slice(0, 10)
    return pageResult(normalizeList(data, genreMap), data, page, limit, (movie) => movie.releaseDate > today)
  }, TTL.upcoming)
  return { ...result.value, cacheHit: result.cacheHit }
}

async function getFeatured() {
  const key = 'home:featured'
  const result = await cachedRequest(key, async () => {
    const [data, genreMap] = await Promise.all([tmdbService.getTrending('week'), getGenreMap()])
    const candidate = (data.results || []).find((movie) => movie.backdrop_path && movie.release_date) || data.results?.[0]
    return candidate ? normalizeMovie({ ...candidate, genreMap }) : null
  }, TTL.featured)
  return { movie: result.value, cacheHit: result.cacheHit }
}

async function getHomepage() {
  const [featured, latest, popular, trending, topRated, upcoming] = await Promise.allSettled([
    getFeatured(), getLatest(1, 20), getPopular(1, 20), getTrending('week', 1, 20), getTopRated(1, 20), getUpcoming(1, 20),
  ])
  const value = (result, fallback) => result.status === 'fulfilled' ? result.value : fallback
  return {
    featured: value(featured, { movie: null }).movie,
    latest: value(latest, emptyFeed()),
    popular: value(popular, emptyFeed()),
    trending: value(trending, emptyFeed()),
    topRated: value(topRated, emptyFeed()),
    upcoming: value(upcoming, emptyFeed()),
    featuredUniverses: universeConfig.filter((universe) => universe.featured),
  }
}

function emptyFeed() {
  return { movies: [], page: 1, totalPages: 0, totalResults: 0 }
}

module.exports = { getHomepage, getFeatured, getLatest, getPopular, getTrending, getTopRated, getUpcoming }
