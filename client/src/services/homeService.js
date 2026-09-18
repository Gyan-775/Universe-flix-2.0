import { request } from './api'
import { normalizeMovie } from './movieService'

function normalizeFeed(feed = {}) {
  return { ...feed, movies: (feed.movies || []).map(normalizeMovie) }
}

export async function getHomepage(options = {}) {
  const data = await request('/home', options)
  return {
    ...data,
    featured: data.featured ? normalizeMovie(data.featured) : null,
    latest: normalizeFeed(data.latest),
    popular: normalizeFeed(data.popular),
    trending: normalizeFeed(data.trending),
    topRated: normalizeFeed(data.topRated),
    upcoming: normalizeFeed(data.upcoming),
  }
}

export async function getHomeFeed(feed, options = {}) {
  const params = new URLSearchParams({ page: String(options.page || 1), limit: String(options.limit || 20) })
  if (options.window) params.set('window', options.window)
  const data = await request(`/home/${feed}?${params}`, { signal: options.signal })
  return normalizeFeed(data)
}
