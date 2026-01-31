const mongoose = require("mongoose");

async function connectDB(){
    try{
        // console.log("=================================>",process.env.MONGODB_URI)

        await mongoose.connect(process.env.MONGODB_URI)
        console.log("Database connected successfully");
    }
    catch(err){
        console.error("Database connection failed",err);
    }
}

module.exports= connectDB;