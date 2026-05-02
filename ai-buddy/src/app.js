const express = require('express');
const cookieParser = require('cookie-parser')
const cors = require('cors');

const app = express();



app.use(cors({
  origin: ['http://localhost:5173','https://market-place-tawny-eight.vercel.app'],
  credentials: true
}));
module.exports = app;