require("dotenv").config();
const app = require("./src/app")
const connectToDb = require('./src/db/db')
const {connect} = require('./src/broker/broker')

connectToDb()

connect();

app.listen(3001,(err)=>{
     console.log("Product server is running on http://localhost:3001")
})