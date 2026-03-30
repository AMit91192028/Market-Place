const express = require('express')
const cartRouter = require('./router/cart.routes')
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/cart', cartRouter)

module.exports = app
