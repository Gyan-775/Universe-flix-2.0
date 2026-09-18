import { request } from './api'

export function normalizeMovie(movie = {}) {
  const releaseDate = movie.releaseDate || movie.release_date || null
  const universe = typeof movie.universe === 'object' ? movie.universe : null

  return {
    id: movie.id ?? movie.tmdbId ?? movie.imdbId ?? null,
    title: movie.title || movie.name || null,
    originalTitle: movie.originalTitle || movie.original_title || null,
    releaseDate,
    year: movie.year ?? (releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : null),
    universe,
    genres: Array.isArray(movie.genres) ? movie.genres.map((genre) => typeof genre === 'string' ? genre : genre.name).filter(Boolean) : [],
    posterPath: movie.posterPath || movie.poster_path || null,
    backdropPath: movie.backdropPath || movie.backdrop_path || null,
    overview: movie.overview || null,
    runtime: movie.runtime ?? null,
    tmdbRating: movie.tmdbRating ?? movie.vote_average ?? null,
    tmdbVoteCount: movie.tmdbVoteCount ?? movie.vote_count ?? null,
    imdbRating: movie.imdbRating ?? null,
    imdbId: movie.imdbId || movie.imdb_id || null,
    imdbUrl: movie.imdbUrl || null,
    cast: Array.isArray(movie.cast) ? movie.cast : [],
    director: movie.director || null,
    trailer: movie.trailer || null,
    videos: Array.isArray(movie.videos) ? movie.videos : [],
    popularity: movie.popularity ?? null,
    prerequisites: Array.isArray(movie.prerequisites) ? movie.prerequisites : [],
    recommendedBefore: Array.isArray(movie.recommendedBefore) ? movie.recommendedBefore : [],
  }
}

export async function getMovies(options = {}) {
  const { signal, ...query } = options
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''))
  const data = await request(`/movies${params.toString() ? `?${params}` : ''}`, { signal })
  return { ...data, movies: (data.movies || []).map(normalizeMovie) }
}

export async function getMovieById(id, options = {}) {
  return normalizeMovie(await request(`/movies/${encodeURIComponent(id)}`, options))
}

export async function getSimilarMovies(id, options = {}) {
  const data = await request(`/movies/${encodeURIComponent(id)}/similar`, options)
  return (data.movies || []).map(normalizeMovie)
}

export async function getFeaturedMovies() {
  return normalizeMovie(await request('/movies/featured'))
}

export async function searchMovies(query, options = {}) {
  if (!query.trim()) return []
  const params = new URLSearchParams({ q: query.trim(), page: String(options.page || 1) })
  const data = await request(`/movies/search?${params}`, { signal: options.signal })
  return { ...data, movies: (data.movies || []).map(normalizeMovie) }
}

export async function getUniverseMovies(slug, options = {}) {
  const params = new URLSearchParams(Object.entries({ page: options.page || 1, limit: options.limit || 20, genre: options.genre, year: options.year, rating: options.rating }).filter(([, value]) => value !== undefined && value !== null && value !== ''))
  const data = await request(`/universes/${encodeURIComponent(slug)}/movies?${params}`, { signal: options.signal })
  return { ...data, movies: (data.movies || []).map(normalizeMovie) }
}

export async function searchUniverseMovies(slug, query, options = {}) {
  const params = new URLSearchParams({ q: query.trim(), page: String(options.page || 1) })
  const data = await request(`/universes/${encodeURIComponent(slug)}/movies/search?${params}`, { signal: options.signal })
  return { ...data, movies: (data.movies || []).map(normalizeMovie) }
}
