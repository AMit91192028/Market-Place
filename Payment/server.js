require('dotenv').config();
const app = require('./src/app');
const connectToDb = require('./src/db/db')
const{connect} = require('./src/broker/broker')

connectToDb();
connect()


app.listen(3004,(err)=>{
    if(err){
        return console.log("Server connection error", err)
    }
    console.log("Payment server is running on http://localhost:3004");
})
