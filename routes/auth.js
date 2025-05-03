// step 1 import
const express = require('express')
const router = express.Router()
const { register, login, currentUser } = require('../controllers/auth')// import controller
const { authCheck, adminCheck } = require('../middleware/authCheck')

router.post('/register', register)
router.post('/login', login)
router.post('/current-user', authCheck, currentUser)// ใช้ใน front-end เพื่อเช็ค authen ว่าล็อกอินหรือยัง
router.post('/current-admin', authCheck, adminCheck , currentUser)

module.exports = router