require('dotenv').config();
const app = require('./src/app');
const connectToDb = require('./src/db/db')

connectToDb();



app.listen(3003,(err)=>{
    if(err){
        return console.log("Server connection error", err)
    }
    console.log("Payment server is running on http://localhost:3004");
})