const express = require('express')
const homeController = require('../controllers/homeController')

const router = express.Router()
router.get('/', homeController.getHome)
router.get('/latest', homeController.getLatest)
router.get('/popular', homeController.getPopular)
router.get('/trending', homeController.getTrending)
router.get('/top-rated', homeController.getTopRated)
router.get('/upcoming', homeController.getUpcoming)

module.exports = router