const { universeConfig } = require('../config/universes')
const { cachedRequest } = require('./cacheService')
const universeMembershipService = require('./universeMembershipService')

async function getUniverses() {
  const result = await cachedRequest('universes:definitions', () => universeConfig, 10 * 60 * 1000)
  return { universes: result.value, cacheHit: result.cacheHit }
}

async function getUniverseBySlug(slug) {
  return universeConfig.find((universe) => universe.slug === slug) || null
}

function getUniverseMovies(slug, options = {}) {
  return universeMembershipService.getUniverseMovies(slug, options)
}

function searchUniverseMovies(slug, query, options = {}) {
  return universeMembershipService.getUniverseMovies(slug, { ...options, textQuery: query })
}

module.exports = { getUniverses, getUniverseBySlug, getUniverseMovies, searchUniverseMovies }
