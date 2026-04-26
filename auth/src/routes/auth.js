const express = require('express');
const {registerUserValidator,loginUserValidations,addUserAddressValidation} = require('../middlewares/vaildator.middleware')
const{authMiddleware} = require("../middlewares/auth.middleware")
const { registerUser, loginUser,getCurrentUser,getUserAddress,addUserAddress,deleteUserAdresses,logoutUser } = require('../controllers/auth.controller')
const router = express.Router();

router.post('/register',registerUserValidator,registerUser);
//Post /auth/login
router.post('/login',loginUserValidations, loginUser);

// GET / api/auth/me

router.get('/me',authMiddleware,getCurrentUser)

// GET /api/auth/
router.get('/user/me/addresses',authMiddleware,getUserAddress)
router.get('/users/me/addresses',authMiddleware,getUserAddress)

// Update user Address
    router.post("/users/me/addresses",addUserAddressValidation, authMiddleware,addUserAddress)

    router.delete("/users/me/addresses/:addressId",authMiddleware,deleteUserAdresses)
//Get /api/auth/logout
router.get("/logout",logoutUser)
module.exports = router;
