import { request } from './api'

export async function getGenres(options = {}) {
  const data = await request('/genres', options)
  return data.genres || []
}