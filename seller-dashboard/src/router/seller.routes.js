const express = require('express')
const createAuthMiddleware = require('../middlewares/auth.middleware')
const { getMetrics, getOrders,getProducts} = require('../controllers/seller.controller')


const router = express.Router()

router.get('/metrics',createAuthMiddleware(['seller']),getMetrics)
router.get('/orders',createAuthMiddleware(['seller']),getOrders)
router.get('/products',createAuthMiddleware(['seller']),getProducts)


module.exports  = router
