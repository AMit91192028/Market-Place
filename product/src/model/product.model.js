const  mongoose = require("mongoose")


const productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:
        {
            type: String,
            trim: true,
            default: '',
        },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price:{
        amount:{
            type:Number,
            required:true
        },
        currency:{
            type:String,
            enum:['USD','INR'],
            default:'INR'
      }
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    images:[{
        url:String,
        thumbnail:String,
        id:String
    }],
    stock:{
        type:Number,
        default:0
    }
},
{
    timestamps: true
})

productSchema.index({title:'text',description:'text', category: 1,});

const product  = mongoose.model("Product",productSchema)
module.exports = product
