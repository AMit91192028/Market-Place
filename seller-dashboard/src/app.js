const express = require("express");
const cookieParser = require('cookie-parser')
const sellerRoutes = require('./router/seller.routes')


const app = express();


app.use(express.json());
app.use(cookieParser());

app.get('/',(req,res)=>{
    res.status(200).json({message:"Seller Dashboard Service is runningcl"})
})
app.use('/api/seller',sellerRoutes);


module.exports = app;