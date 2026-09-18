const { query } = require('../db')
const { getProfile } = require('./sessionService')

async function getRecommendations(sessionId, limit = 12) {
  const profile = sessionId ? await getProfile(sessionId) : {}
  const genres = Array.isArray(profile.preferredGenres) ? profile.preferredGenres : []
  const params = [limit]
  const genreClause = genres.length ? `WHERE EXISTS (SELECT 1 FROM movie_genres mg JOIN genres g ON g.id = mg.genre_id WHERE mg.movie_id = m.id AND g.name = ANY($2))` : ''
  if (genres.length) params.push(genres)
  let result
  try { result = await query(`SELECT m.* FROM movies m ${genreClause} ORDER BY m.tmdb_rating DESC NULLS LAST, m.popularity DESC NULLS LAST LIMIT $1`, params) } catch (error) { if (error.code === 'DATABASE_NOT_CONFIGURED') return { profile, recommendations: [] }; throw error }
  return { profile, recommendations: result.rows.map((movie) => ({ movie, matchScore: Number(movie.tmdb_rating || 0) / 10, reason: genres.length ? 'Matches your preferred genres.' : 'Highly rated in the archive.' })) }
}

module.exports = { getRecommendations }
