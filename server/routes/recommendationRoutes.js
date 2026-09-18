const express = require('express')
const controller = require('../controllers/recommendationController')

const router = express.Router()
router.get('/', controller.getRecommendations)
module.exports = router
