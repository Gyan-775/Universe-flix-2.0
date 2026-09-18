const express = require('express')
const universeController = require('../controllers/universeController')

const router = express.Router()

router.get('/', universeController.getUniverses)
router.get('/:slug/debug', universeController.debugUniverse)
router.get('/:slug/movies/search', universeController.searchUniverseMovies)
router.get('/:slug/movies', universeController.getUniverseMovies)

module.exports = router
