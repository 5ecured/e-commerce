const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const productSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    price: {
        type: Number,
        trim: true,
        required: true,
        maxlength: 32
    },
    category: {
        //Below is how you create a relationship between one model to another. In this case, Product and Category. By using type of 'mongoose.Schema.ObjectId', and ref 'Category'
        type: ObjectId,
        ref: 'Category',
        required: true
    },
    quantity: { //This is needed so admin can keep track of the stock 
        type: Number
    },
    sold: { 
        type: Number,
        default: 0
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    shipping: {
        required: false,
        type: Boolean
    }
}, { timestamps: true }
)


module.exports = mongoose.model('Product', productSchema)