const express = require('express')
const router = express.Router()
const { authCheck } = require('../middleware/authCheck')
const { changeOrderStatus, getOrderAdmin, getDashboard  } = require('../controllers/admin')

router.put('/admin/order-status', authCheck, changeOrderStatus)
router.get('/admin/orders', authCheck, getOrderAdmin)
router.get('/admin/dashboard', authCheck, getDashboard)

module.exports = router