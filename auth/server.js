const app = require('./src/app');
const connectDB = require("./src/db/db")
const {connect} = require('./src/broker/broker')

connectDB()
.then(async ()=>{
   await connect(); 
app.listen(3000,(err)=>{
    if(err){

    }

    console.log("server is started at http://localhost:3000")
})
})











