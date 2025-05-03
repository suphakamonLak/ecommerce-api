const express  = require('express')
const router = express.Router()
const { create, list, remove } = require('../controllers/category')
const { authCheck, adminCheck } = require('../middleware/authCheck')

// @ENDPOINT http://localhost:5000/api/category
router.get('/category', authCheck, adminCheck, list)
router.post('/category', authCheck, adminCheck, create)
router.delete('/category/:id', authCheck, adminCheck, remove)

module.exports = router