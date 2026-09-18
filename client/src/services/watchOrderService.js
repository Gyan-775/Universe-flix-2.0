import { request } from './api'

import { normalizeMovie } from './movieService'

export async function getWatchOrder(movieId, mode = 'essential', options = {}) {
  const data = await request(`/watch-order/${encodeURIComponent(movieId)}?mode=${encodeURIComponent(mode)}`, options)
  return { ...data, movies: (data.movies || data.results || []).map(normalizeMovie) }
}
