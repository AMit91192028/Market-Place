const paymentModel = require('../models/payment.model')
const axios = require('axios')
const Razorpay = require('razorpay')
const {publishToQueue} = require('../broker/broker')
const razorpay =  new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})

async function createPayment(req,res){
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
    try{
        const orderId = req.params.orderId;
        const orderResponse = await axios.get("http://localhost:3003/api/orders/"+ orderId,{headers:{
                    Authorization:`Bearer ${token}`
        }})

        const price  = orderResponse.data.order.totalPrice

        const razorpayOrder = await razorpay.orders.create({
            amount: price.amount,
            currency: price.currency,
            receipt: `order_${orderId}`
        });

        const payment = await paymentModel.create({
            order:orderId,
            razorpayOrderId:razorpayOrder.id,
            price:{
                amount:razorpayOrder.amount,
                currency:razorpayOrder.currency
            },
            user:req.user.id
        })

            await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED", payment)

            await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", {
                    email: req.user.email,
                    orderId: orderId,
                    amount: price.amount / 100,
                    currency: price.currency,
                    username: req.user.username,
    })        

        return res.status(201).json({message:'Payment initiated', payment});
    }
    catch(err){
       console.error('Error creating payment', err);
       return res.status(500).json({message:'Internal Server Error'});
    }
}


async function verifyPayment(req,res){
    const {razorpayOrderId, paymentId,signature} = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET

    try{
        const {validatePaymentVerification} = require('../../node_modules/razorpay/dist/utils/razorpay-utils')

        const isValid = validatePaymentVerification({
            order_id:razorpayOrderId,
            payment_id:paymentId
        },signature,secret)

        if(!isValid){
            return res.status(400).json({message:'Invalid signature'});
        }

        const payment = await paymentModel.findOne({razorpayOrderId,status:'PENDING'});

        if(!payment){
            return res.status(404).json({message:'Payment not found'});
        }
    
        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.status = 'COMPLETED';
        await payment.save();

 await publishToQueue("Payment_NOTIFICATION.PAYMENT_COMPLETED",
            {
                email:req.user.email,
                orderId:payment.order,
                paymentId:payment.paymentId,
                amount:payment.price.amount/100,
                currency:payment.price.currency,
                username:req.user.username

            });
await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED", payment)
        res.status(200).json({message:'Payment verified successfully',payment})
}
    catch(err){
          console.error('Error verifying payment', err);
          await publishToQueue("Payment_NOTIFICATION.PAYMENT_FAILED",
            {
                email:req.user.email,
                paymentId:paymentId,
                orderId:razorpayOrderId,
                username:req.user.username
            });
            return res.status(500).json({message:'Internal Server Error'})
        }
}
module.exports = {createPayment,verifyPayment}
