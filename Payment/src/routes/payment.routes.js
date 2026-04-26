const express = require('express');
const createAuthMiddleware = require('../middleware/auth.middleware')
const{createPayment,verifyPayment} = require('../controllers/payment.controllers');

const router = express.Router();

router.post("/create/:orderId",createAuthMiddleware(['user']),createPayment)

router.post("/verify",createAuthMiddleware(['user']),verifyPayment)


module.exports = router