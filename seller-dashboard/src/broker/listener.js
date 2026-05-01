const { subscribeToQueue } = require("./broker")
const userModel = require("../models/users.model")
const productModel = require("../models/product.model")
const orderModel = require("../models/order.model")
const paymentModel = require("../models/payment.model")

module.exports = async function () {
    
    subscribeToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED", async (user) => {
        await userModel.create(user)
    })

    subscribeToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED", async (product) => {
        await productModel.create(product)
    })

    subscribeToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_UPDATED", async (product) => {
        await productModel.findOneAndUpdate(
            { _id: product._id },
            { ...product },
            { new: true, upsert: true }
        )
    })

    subscribeToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_DELETED", async (product) => {
        await productModel.findOneAndDelete({ _id: product._id })
    })

    subscribeToQueue("ORDER_SELLER_DASHBOARD.ORDER_CREATED", async (order) => {
        await orderModel.create(order)
    })

    subscribeToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED", async (payment) => {
        await paymentModel.create(payment)
    })

    subscribeToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED", async (payment) => {
        await paymentModel.findOneAndUpdate(
            { order: payment.order },
            { ...payment },
            { new: true }
        )
    })
} 
