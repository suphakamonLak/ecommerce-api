const express  = require('express')
const router = express.Router()
const { create, list, remove } = require('../controllers/category')

// @ENDPOINT http://localhost:5000/api/category
router.get('/category', list)
router.post('/category', create)
router.delete('/category/:id', remove)

module.exports = router