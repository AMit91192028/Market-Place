const userModel = require('../models/users.model');
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const redis = require("../db/redis")
const{publishToQueue} = require("../broker/broker")

function isSecureRequest(req) {
    return (
        req.secure ||
        req.headers['x-forwarded-proto'] === 'https'
    );
}

function getCookieOptions(req) {
    const secure = isSecureRequest(req);

    return {
        httpOnly: true,
        secure:false,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
    };
}

async function registerUser(req,res){
    const{username, email,password,fullName:{firstName,lastName},role} = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or:[
           {username},
           {email} 

        ]
    });

    if(isUserAlreadyExists){
        return res.status(409).json({message:"Username or email already extis"});
    }

    const hash = await bcrypt.hash(password,10);

    const user = await userModel.create({
        username,
        email,
        password:hash,
        fullName:{firstName,lastName},
        role:role ||'user'
    })

        // Publish user created event to rabbitmq
            await Promise.all([
                publishToQueue('AUTH_NOTIFICATION.USER_CREATED',{
                    id:user._id,
                    username:user.username,
                    email:user.email,
                    fullName:user.fullName,
                }),
                publishToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED",user)
            ]);

    const token = jwt.sign({
        id:user._id,
        username:user.username,
        email:user.email,
        role:user.role
 },process.env.JWT_SECRET,{expiresIn:'1d'})

    res.cookie('token', token, getCookieOptions(req))

    res.status(201).json({message:"User registered successfully",
        token,
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
            fullName:user.fullName,
            role:user.role,
            addresses:user.addresses
        
}})

}

async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        const user = await userModel.findOne({
            $or: [{ username }, { email }]
        }).select('+password');

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password || '');
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, getCookieOptions(req));

        res.status(200).json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                addresses: user.addresses || [],
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getCurrentUser(req, res){
    const user = await userModel.findById(req.user.id).select('username email fullName role addresses');

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            addresses: user.addresses || [],
        }
    });
}

async function getUserAddress(req, res){
    const {id} = req.user;

    const user = await userModel.findById(id).select('addresses');
    
    if(!user){
        return res.status(404).json({message:"User not found"});
    }

    return res.status(200).json({
        message:"User addresses fetched successfully",
        addresses:user.addresses
    })
}

async function addUserAddress(req,res){
    const id = req.user.id;

    const{street, city,  state, pincode, country, isDefault} = req.body;

    const user = await userModel.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          addresses: {
            street,
            city,
            state,
            zip:pincode,
            country,
            isDefault,
          }
        }
        
      },{new : true}
    );

    if(!user){
        return res.status(404).json({message:"User not found"})
    }

    return res.status(201).json({
        message:"Address added successfully",
        address:user.addresses[user.addresses.length-1]
    })
}

async function deleteUserAdresses(req, res){
        const{id} = req.user;
        const{addressId} = req.params;
          const isAddressExits = await userModel.findOne({_id:id,'addresses._id':addressId}) ;
          if(!isAddressExits){
            return res.status(404).json({message:"Addresses is not found"})
          }
        const user = await userModel.findOneAndUpdate({_id:id},{
            $pull:{
                addresses:{_id:addressId}
            }
        },{new:true})

        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        const addressExists = user.addresses.some(addr=>addr.id.toString()===addressId); 

            if(addressExists){
                return res.status(500).json({message:"Failed to delete address"});
            }
            return res.status(200).json({
                messsage:"Address deleted successfully",
                addresses:user.addresses
            })
    }

async function logoutUser(req,res){
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

    if(token){
        await redis.set(`blacklist:${token}`,'true','Ex',24*60*60)
    }

    res.clearCookie('token', getCookieOptions(req));

    return res.status(200).json({message:"Logged out successfully"})
}




module.exports = { registerUser, loginUser,getCurrentUser,getUserAddress,addUserAddress,deleteUserAdresses,logoutUser }
