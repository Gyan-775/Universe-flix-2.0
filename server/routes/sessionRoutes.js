const express = require('express')
const controller = require('../controllers/sessionController')

const router = express.Router()
router.post('/', controller.createSession)
router.get('/', controller.getSession)
router.get('/profile', controller.getProfile)
router.post('/taste', controller.saveTaste)
router.post('/interaction', controller.interaction)

module.exports = router
