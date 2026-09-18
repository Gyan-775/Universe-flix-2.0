const express = require('express')
const watchOrderController = require('../controllers/watchOrderController')

const router = express.Router()
router.get('/:id', watchOrderController.getWatchOrder)

module.exports = router