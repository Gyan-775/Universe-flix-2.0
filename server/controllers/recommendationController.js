const recommendationService = require('../services/recommendationService')
const { readSessionId } = require('../services/sessionService')

async function getRecommendations(req, res, next) {
  try {
    return res.json(await recommendationService.getRecommendations(readSessionId(req)))
  } catch (error) {
    return next(error)
  }
}

module.exports = { getRecommendations }
