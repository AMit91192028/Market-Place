const express = require('express');
const createAuthMiddleware = require("../middleware/auth.middleware")
const cartController = require("../controllers/cart.controller")
const validation = require("../middleware/validation.middleware")



const router = express.Router();



router.get('/',
    createAuthMiddleware([ 'user' ]),
    cartController.getCart
);


router.post("/items",
    validation.validateAddItemToCart,
    createAuthMiddleware([ "user" ]),
    cartController.addItemToCart
)


router.patch(
    '/items/:productId',
    validation.validateUpdateCartItem,
    createAuthMiddleware([ 'user' ]),
    cartController.updateItemQuantity
);


module.exports = router;