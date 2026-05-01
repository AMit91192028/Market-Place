require('dotenv').config()
const app = require('./src/app')


app.listen(3006,()=>{
    console.log('Notification server is running on http://localhost:3006')
})