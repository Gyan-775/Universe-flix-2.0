import { request } from './api'

export async function getUniverses() {
  const data = await request('/universes')
  return data.universes || data.results || []
}

export async function getUniverseById(id) {
  return request(`/universes/${encodeURIComponent(id)}`)
}
