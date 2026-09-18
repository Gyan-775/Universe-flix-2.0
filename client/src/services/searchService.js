import { searchMovies as fetchSearchResults } from './movieService'

export function searchMovies(query, options = {}) {
  return fetchSearchResults(query, options)
}