const express = require("express");
const { connect, subscribeToQueue } = require("./broker/broker");
const setListeners = require("./broker/listners");
const cors = require('cors')
const app = express();
app.use(cors({
  origin: ['http://localhost:5173','https://market-place-tawny-eight.vercel.app'],
  credentials: true
}));
connect().then(() => {
    setListeners();
})

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Notification service is running"
    });
})



module.exports = app;