const mongoose = require("mongoose")


async function connectToDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected Succesfully")
    }
    catch(err){
        console.log("Erroe in Database connection", err)
    }
}

module.exports = connectToDB