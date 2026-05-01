const  mongoose  = require('mongoose');
const productModel = require('../model/product.model')
const {uploadImage} = require('../services/imagekit.service');
// const mongoose = require('mongoose');
const { publishToQueue } = require("../broker/broker")

function escapeRegex(value = '') {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseNonNegativeInteger(value, fallbackValue) {
    const parsedValue = Number.parseInt(value, 10);

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
        return fallbackValue;
    }

    return parsedValue;
}

function buildProductSort(sortKey, hasSearchQuery) {
    switch (sortKey) {
        case 'price-low':
            return { 'price.amount': 1, createdAt: -1 };
        case 'price-high':
            return { 'price.amount': -1, createdAt: -1 };
        case 'stock':
            return { stock: -1, createdAt: -1 };
        case 'featured':
        default:
            if (hasSearchQuery) {
                return { score: { $meta: 'textScore' }, createdAt: -1 };
            }

            return { createdAt: -1 };
    }
}

function normalizeDescriptionInput(description) {
    if (Array.isArray(description)) {
        return description
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .join('\n');
    }

    const rawValue = String(description || '').trim();

    if (!rawValue) {
        return '';
    }

    if (rawValue.startsWith('[')) {
        try {
            const parsedValue = JSON.parse(rawValue);

            if (Array.isArray(parsedValue)) {
                return parsedValue
                    .map((item) => String(item || '').trim())
                    .filter(Boolean)
                    .join('\n');
            }
        } catch (error) {
            // Fall back to line-based normalization below when the payload is not valid JSON.
        }
    }

    return rawValue
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
        .filter(Boolean)
        .join('\n');
}


// Accepts multipart/form-data with fields: title, description, priceAmount, priceCurrency, images[] (files)
async function createProduct(req, res) {
    console.log('createProduct called');
    try {
        const { title, description, category,priceAmount, priceCurrency = 'INR', stock = 0 } = req.body;

        const seller = req.user.id; // Extract seller from authenticated user

        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency,
        };

        const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));

        const normalizedDescription = normalizeDescriptionInput(description);

        const product = await productModel.create({
            title,
            description: normalizedDescription,
            category,
            price,
            seller,
            images,
            stock: Number(stock) || 0,
        });
        const productPayload = product.toObject();

        await Promise.all([
            publishToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED",productPayload),
            publishToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED",{
                email: req.user.email,
                username:req.user.username,
                productId:product._id,
                sellerId:seller

            })
        ]);

        return res.status(201).json({
            message: 'Product created',
            data: product,
        });
    } catch (err) {
        console.error('Create product error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProducts(req,res){
        const{q, category, minprice, maxprice, skip, limit=20, sort='featured'} = req.query

        const filter ={}
        const searchQuery = String(q || '').trim()
        const categoryFilter = String(category || '').trim()
        const parsedSkip = parseNonNegativeInteger(skip, 0)
        const parsedLimit = Math.min(parseNonNegativeInteger(limit, 20) || 20, 20)

        if(searchQuery){
            filter.$text = {$search:searchQuery}
        }

        if(categoryFilter){
            filter.category = new RegExp(`^${escapeRegex(categoryFilter)}$`, 'i')
        }
        if(minprice){
            filter['price.amount'] = {...filter['price.amount'],$gte:Number(minprice)}
        }

        if(maxprice){
            filter['price.amount'] = {...filter['price.amount'],$lte:Number(maxprice)}
        }

        const projection = searchQuery
            ? { score: { $meta: 'textScore' } }
            : undefined;

        const [products, total] = await Promise.all([
            productModel
                .find(filter, projection)
                .sort(buildProductSort(sort, Boolean(searchQuery)))
                .skip(parsedSkip)
                .limit(parsedLimit),
            productModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            data:products,
            meta: {
                total,
                skip: parsedSkip,
                limit: parsedLimit,
                hasMore: parsedSkip + products.length < total,
            }
        });
}

async function getProductById(req,res){
        const {id} = req.params;

        const product = await productModel.findById(id);

           if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ data: product });
}

async function updateProduct(req,res){
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({message:'Invalid product id'});
    }

    const product = await productModel.findOne({
        _id:id,
    })

    if(!product){
        return res.status(404).json({message:'Product not found'});
    }

    if(product.seller.toString() != req.user.id){
        return res.status(403).json({message:'Forbidden: Not owner'})
    }

    const allowedUpdates = ['title','description','category','price', 'stock'];
       for (const key of Object.keys(req.body)) {
            if (allowedUpdates.includes(key)) {
                if (key === 'price' && typeof req.body.price === 'object') {
                    if (req.body.price.amount !== undefined) {
                        product.price.amount = Number(req.body.price.amount);
                    }
                if (req.body.price.currency !== undefined) {
                    product.price.currency = req.body.price.currency;
                }
            } else if (key === 'stock') {
                product.stock = Number(req.body.stock);
            } else if (key === 'description') {
                product.description = normalizeDescriptionInput(req.body.description);
            } else {
                product[ key ] = req.body[ key ];
            }

        }
    }
    await product.save();

    await publishToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_UPDATED", product.toObject());

    return res.status(200).json({ message: 'Product updated', product });
}

async function deleteProduct(req,res){
       const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({message:'Invalid product id'});
    }

    const product = await productModel.findOne({
        _id:id,
    })

    if(!product){
        return res.status(404).json({message:'Product not found'});
    }
    
     if(product.seller.toString() != req.user.id){
        return res.status(403).json({message:'Forbidden: Not owner'})
    }

    await productModel.findOneAndDelete({_id:id});
    await publishToQueue("PRODUCT_SELLER_DASHBOARD.PRODUCT_DELETED", { _id: id });

    return res.status(200).json({message:'Product deleted',product:{_id:id}})
}

async function getProductsBySeller(req,res){
    const seller = req.user;

    const{skip=0 , limit = 20} = req.query;

    const products = await productModel
        .find({seller:seller.id})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit,20));

    return res.status(200).json({data:products});

}


module.exports = { createProduct, getProducts , getProductById,updateProduct,deleteProduct , getProductsBySeller  };
