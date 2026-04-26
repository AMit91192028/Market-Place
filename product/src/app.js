 const express = require("express");
 const cors = require('cors');
 const cookieParser = require("cookie-parser");
 const ProductRoutes = require('../src/routers/product.routes.js')
 
 const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
 app.use(express.json());
 app.use(express.urlencoded({ extended: true }));
 app.use(cookieParser())
 app.use('/api/products',ProductRoutes)

 module.exports = app;