const express = require("express");
const cookieParser = require('cookie-parser')
const cors = require('cors')
const sellerRoutes = require('./router/seller.routes')


const app = express();

app.use(cors({
  origin: 'https://market-place-git-main-amit91192028s-projects.vercel.app',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/',(req,res)=>{
    res.status(200).json({message:"Seller Dashboard Service is runningcl"})
})
app.use('/api/seller',sellerRoutes);


module.exports = app;