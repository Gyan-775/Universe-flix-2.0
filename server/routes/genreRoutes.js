const express = require('express')
const genreController = require('../controllers/genreController')

const router = express.Router()
router.get('/', genreController.getGenres)

module.exports = router
