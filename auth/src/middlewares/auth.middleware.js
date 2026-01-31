// const userModule = require('../models/users.model');
const jwt = require('jsonwebtoken');

async function authMiddleware(req,res,next){
        const token = req.cookies.token;
        if(!token){
            return res.status(401).json({message:"Unauthorized"});
        }

        try{
            const decode = jwt.verify(token,process.env.JWT_SECRET);
            const user = decode
            req.user = user;
            next();
        }
        catch(error){
            return res.status(401).json({message:"Unauthorized"});
        }
}

module.exports={authMiddleware}