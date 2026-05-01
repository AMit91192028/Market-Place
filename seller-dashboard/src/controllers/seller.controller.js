const userModel = require('../models/users.model')
const productModel = require('../models/product.model')
const orderModel = require('../models/order.model')
const paymentModel = require('../models/payment.model')

async function getMetrics(req, res) {
    try {
        const seller = req.user;

        // Get all products for this seller
        const products = await productModel.find({ seller: seller._id });
        const productIds = products.map(p => p._id);
        const productIdSet = new Set(productIds.map((productId) => String(productId)));

        // Get all orders containing seller's products
        const orders = await orderModel.find({
            'items.product': { $in: productIds }
        });
        const payments = await paymentModel.find({
            order: { $in: orders.map((order) => order._id) }
        });
        const paidOrderIds = new Set(
            payments
                .filter((payment) => payment.status === "COMPLETED")
                .map((payment) => String(payment.order))
        );

        // Sales: total number of items sold
        let sales = 0;
        let revenue = 0;
        const productSales = {};
        let pendingOrders = 0;

        orders.forEach(order => {
            const isPaidOrder =
                paidOrderIds.has(String(order._id)) ||
                [ "CONFIRMED", "SHIPPED", "DELIVERED" ].includes(order.status);

            if (order.status === "PENDING") {
                pendingOrders += 1;
            }

            if (!isPaidOrder) {
                return;
            }

            order.items.forEach(item => {
                const productId = String(item.product);

                if (productIdSet.has(productId)) {
                    sales += item.quantity;
                    revenue += item.price.amount;
                    productSales[ productId ] = (productSales[ productId ] || 0) + item.quantity;
                }
            });
        });

        // Top products by quantity sold
        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[ 1 ] - a[ 1 ])
            .slice(0, 5)
            .map(([ productId, qty ]) => {
                const prod = products.find(p => String(p._id) === productId);
                return prod ? { id: prod._id, title: prod.title, sold: qty } : null;
            })
            .filter(Boolean);

        return res.json({
            sales,
            revenue,
            topProducts,
            totalOrders: orders.length,
            pendingOrders,
            paidOrders: paidOrderIds.size
        });
    } catch (error) {
        console.error("Error fetching metrics:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function getOrders(req, res) {
    try {
        const seller = req.user;

        // Get all products for this seller
        const products = await productModel.find({ seller: seller._id });
        const productIds = products.map(p => p._id);
        const productIdSet = new Set(productIds.map((productId) => String(productId)));

        // Get all orders containing seller's products
        const orders = await orderModel.find({
            'items.product': { $in: productIds }
        }).populate('user', 'name email').sort({ createdAt: -1 });
        const payments = await paymentModel.find({
            order: { $in: orders.map((order) => order._id) }
        });
        const paymentByOrderId = payments.reduce((result, payment) => {
            result[ String(payment.order) ] = payment;
            return result;
        }, {});

        // Filter order items to only include those from this seller
        const filteredOrders = orders.map(order => {
            const filteredItems = order.items.filter(item => productIdSet.has(String(item.product)));
            const payment = paymentByOrderId[ String(order._id) ];

            return {
                ...order.toObject(),
                items: filteredItems,
                paymentStatus: payment?.status || "NOT_INITIATED",
                paymentAmount: payment?.price || null,
                paymentUpdatedAt: payment?.updatedAt || null
            };
        }).filter(order => order.items.length > 0);
        return res.json(filteredOrders);
    } catch (error) {
        console.error("Error fetching orders:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function getProducts(req, res) {

    try {
        const seller = req.user;

        const products = await productModel.find({ seller: seller._id }).sort({ createdAt: -1 });

        return res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}

module.exports = {
    getMetrics,
    getOrders,
    getProducts
}
