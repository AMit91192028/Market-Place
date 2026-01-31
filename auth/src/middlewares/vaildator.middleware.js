const {body,validationResult} = require("express-validator");
const { errors } = require("mongodb-memory-server");

const responseWithValidationErrors = (req,res,next)=>{
   const errors = validationResult(req);
   if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
   } 
   next();
}

const  registerUserValidator = [
    body("username")
    .isString()
    .withMessage("Username must be a string")
    .isLength({min:3})
    .withMessage("Username must be at least 3 characters long"),

    body("email")
    .isEmail()
    .withMessage("Invalid email address"),

    body("password")
    .isLength({min:6})
    .withMessage("password must be at leat 6 characters long"),

    body("fullName.firstName")
    .isString()
    .withMessage("first name must be a string")
    .notEmpty()
    .withMessage("first name is required"),

    body("fullName.lastName")
    .isString()
    .withMessage("Last name must be a string")
    .notEmpty()
    .withMessage("Last name is required"),
    body("role")
    .optional()
    .isIn(['user','seller'])
    .withMessage("Role must be either 'user' or 'seller'"),

    responseWithValidationErrors
]

const loginUserValidations=[
     body("username")
    .optional()
    .isString()
    .withMessage("Username must be a string"),

    body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address"),
    body("password")
    .isLength({min:6})
    .withMessage("password must be at leat 6 characters long"),
    (req,res,next)=>{
        if(!req.body.email && !req.body.username){
            return res.status(400).json({errors:[{msg:'Either email or username is required'}]})
        }
    },
    responseWithValidationErrors

]

const addUserAddressValidation=[
    body("street")
    .isString()
    .withMessage("Street must be a string ")
    .notEmpty()
    .withMessage("Street is required") ,

    body("city")
    .isString()
    .withMessage("city must be a string ")
    .notEmpty()
    .withMessage("city is required"),

    body("pincode")
    .isString()
    .withMessage("pincode must be a string ")
    .notEmpty()
    .withMessage("pincode is required"),

    body("country")
    .isString()
    .withMessage("country must be a string ")
    .notEmpty()
    .withMessage("country is required"),

    body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean ")
   



]

module.exports = {registerUserValidator,loginUserValidations,addUserAddressValidation}