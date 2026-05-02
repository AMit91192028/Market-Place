const express = require('express')
const cookieParser = require('cookie-parser');
const paymentRouter = require('./routes/payment.routes')
const cors = require('cors')

const app = express();
const app = express();
app.use(cors({
  origin: ['http://localhost:5173','https://market-place-tawny-eight.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/payments',paymentRouter);



module.exports = app;
