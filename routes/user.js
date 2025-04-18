const express = require('express')
const router = express.Router()
const { 
    listUsers, 
    changeStatus, 
    ChangeRole,  
    userCart,
    getUserCart,
    emptyCart,
    saveAddress,
    saveOrder,
    getOrder
} = require('../controllers/user')
const { authCheck, adminCheck } = require('../middleware/authCheck')

// role admin
router.get('/users', authCheck, adminCheck, listUsers)// เพิ่ม secure (เช็ค user แล้วก็เช็ค role admin)
router.post('/change-status', authCheck, adminCheck, changeStatus)
router.post('/change-role', authCheck, adminCheck, ChangeRole)

// role user
router.post('/user/cart', authCheck, userCart)
router.get('/user/cart', authCheck, getUserCart)
router.delete('/user/cart', authCheck, emptyCart)

router.post('/user/address', authCheck, saveAddress)

router.post('/user/order', authCheck, saveOrder)
router.get('/user/order', authCheck, getOrder)

module.exports = router