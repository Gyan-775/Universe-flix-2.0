import { request } from './api'

export async function getRecommendations() {
  const data = await request('/recommendations')
  return data.recommendations || data.results || []
}

export async function getSimilarMovies(movieId) {
  const data = await request(`/movies/${encodeURIComponent(movieId)}/similar`)
  return data.movies || data.results || []
}
