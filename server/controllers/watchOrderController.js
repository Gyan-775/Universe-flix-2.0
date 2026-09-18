const watchOrderService = require('../services/watchOrderService')

async function getWatchOrder(req, res, next) {
  const id = Number.parseInt(req.params.id, 10)
  const mode = ['essential', 'complete', 'release'].includes(req.query.mode) ? req.query.mode : 'essential'
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'movie id must be a positive integer' })
  try { return res.json(await watchOrderService.getWatchOrder(id, mode)) } catch (error) { return next(error) }
}

module.exports = { getWatchOrder }