const mongoose = require('mongoose');

async function connectToDb(){
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected")
    }
    catch(err){
            console.log("Error in DB connection",err)
    }
}

module.exports = connectToDb