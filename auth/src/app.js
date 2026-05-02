require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');


const app = express();

app.use(cors({
  origin: ['http://localhost:5173','https://market-place-tawny-eight.vercel.app'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser())

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Auth service is running"
    });
})

app.use('/api/auth', authRoutes);


module.exports = app;