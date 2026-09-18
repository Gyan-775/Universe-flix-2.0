const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function imageUrl(path, size = 'w500') {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${TMDB_IMAGE_BASE}/${size}/${String(path).replace(/^\//, '')}`
}

export const posterUrl = (path) => imageUrl(path, 'w500')
export const backdropUrl = (path) => imageUrl(path, 'original')
export const profileUrl = (path) => imageUrl(path, 'w185')
