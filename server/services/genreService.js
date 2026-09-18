const tmdbService = require('./tmdbService')
const { cachedRequest } = require('./cacheService')

async function getGenres() {
  const result = await cachedRequest('genres:movie', () => tmdbService.getGenres(), 10 * 60 * 1000)
  return { genres: result.value.genres || [], cacheHit: result.cacheHit }
}

module.exports = { getGenres }
