const express = require('express')
const multer = require('multer')
const{createProduct,getProducts,getProductById,updateProduct,deleteProduct,getProductsBySeller} = require('../controllers/product.controller')
const createAuthMiddleware = require("../middleware/auth.middleware")
const{createProductValidators} = require("../validator/product.validators")
const router = express.Router();

const upload = multer({storage:multer.memoryStorage()});

//POST /api/products
router.post(
    '/',
     createAuthMiddleware(['admin','seller']),
     upload.array('images',5),
     createProductValidators,
     createProduct
    );

//GET /api/products
router.get('/',getProducts)

router.get("/seller",createAuthMiddleware(["seller"]), getProductsBySeller)


//GET /api/products/:id
router.get('/:id',getProductById)

router.patch("/:id",createAuthMiddleware(["seller"]),updateProduct)

router.delete("/:id",createAuthMiddleware(["seller"]),deleteProduct)

module.exports = router