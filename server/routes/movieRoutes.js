const express = require('express')
const movieController = require('../controllers/movieController')

const router = express.Router()

router.get('/search', movieController.searchMovies)
router.get('/featured', movieController.getFeaturedMovie)
router.get('/', movieController.getMovies)
router.get('/:id/similar', movieController.getSimilarMovies)
router.get('/:id', movieController.getMovieById)

module.exports = router
