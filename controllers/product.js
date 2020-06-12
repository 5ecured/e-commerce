const Product = require('../models/product')
const formidable = require('formidable')
const _ = require('lodash')
const fs = require('fs')
const { errorHandler } = require('../helpers/dbErrorHandler')

exports.productById = async (req, res, next, id) => {
    try {
        let product = await Product.findById(id).populate('category')
        req.product = product
        next()
    } catch (error) {
        return res.status(400).json({
            error: 'Product not found'
        })
    }
}

exports.read = (req, res) => {
    req.product.photo = undefined
    return res.json(req.product)
}


exports.create = (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, (err, fields, files) => { //fields are things like name, description
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            })
        }

        const { name, description, price, category, quantity, shipping } = fields

        if (!name || !description || !price || !category || !quantity || !shipping) {
            return res.status(400).json({
                error: 'Please fill all fields'
            })
        }

        let product = new Product(fields)

        //if the frontend provides a photo in addition to the fields (name, description etc)
        if (files.photo) {
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error: 'Image must be less than 1MB in size'
                })
            }
            product.photo.data = fs.readFileSync(files.photo.path)
            product.photo.contentType = files.photo.type
        }

        product.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }

            res.json(result)
        })

    })
}

exports.remove = async (req, res) => {
    try {
        let product = req.product
        await product.remove()
        res.json({
            message: 'Product deleted successfully'
        })
    } catch (error) {
        return res.status(400).json({
            error: errorHandler(error)
        })
    }
}

exports.update = (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, (err, fields, files) => { //fields are things like name, description
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            })
        }

        let product = req.product //req.product is the original version
        product = _.extend(product, fields) //with the help of lodash, product is now the updated version


        //if the frontend provides a photo in addition to the fields (name, description etc)
        if (files.photo) {
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error: 'Image must be less than 1MB in size'
                })
            }
            product.photo.data = fs.readFileSync(files.photo.path)
            product.photo.contentType = files.photo.type
        }

        product.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }

            res.json(result)
        })

    })
}



/****************
Now we need to start dealing with the frontend. We need to return things to the frontend, depending on the queries/parameters. 
For example, if a product sells a lot, we need to move it up so our users know it is the most popular product. 
Another example, a product that has newly arrived

Example parameter/query that comes from frontend: 

BASED ON NUMBER OF SOLD PRODUCTS: /products?sortBy=sold&order=desc&limit=4
BASED ON ARRIVAL: /products?sortBy=createdAt&order=desc&limit=4
HOWEVER IF NO PARAMETER/QUERY then all products will be returned
****************/

exports.list = async (req, res) => {
    let order = req.query.order ? req.query.order : 'asc'
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id'
    let limit = req.query.limit ? Number(req.query.limit) : 6

    //Now we can start pulling all the products from the database, based on the above queries/parameters

    try {
        const products = await Product.find()
            .select('-photo')
            .populate('category') //This populate is possible because of the relationship created in the Product model ('type' and 'ref')
            .sort([[sortBy, order]])
            .limit(limit)
        res.json(products)
    } catch (error) {
        return res.status(400).json({
            error: 'Products not found'
        })
    }
}


/*************
This one will return the products based on the request product category. It does this by finding the category of the product that we are getting in the request.
Based on that, other products that have the same category will be returned
*************/

exports.listRelated = async (req, res) => {
    let limit = req.query.limit ? Number(req.query.limit) : 6

    try {
        //Now we find all the products NOT including the current product in the request. Because we want RELATED ones.
        const products = await Product.find({
            _id: { $ne: req.product }, //This one excludes the current product. $ne is "not equal"
            category: req.product.category  //This one ensures that the category is the same because we are looking for related ones
        })
            .limit(limit)
            .populate('category', '_id name')

        res.json(products)
    } catch (error) {
        return res.status(400).json({
            error: 'Products not found'
        })
    }
}

/*************
This one will return all categories based on a product
*************/
exports.listCategories = async (req, res) => {
    //Find all the categories that are used in the product

    try {
        const categories = await Product.distinct('category', {})
        res.json(categories)
    } catch (error) {
        return res.status(400).json({
            error: 'Categories not found'
        })
    }
}




/**
 * list products by search. Imagine the frontend page, where on the left there is a sidebar 
 * where we show categories, price, etc (checkboxes, radio buttons. Basically filtering)
 * 
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what they want
 */

exports.listBySearch = (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? Number(req.body.limit) : 100;
    let skip = Number(req.body.skip) //This will be used for "load more" in the frontend
    let findArgs = {};

    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);

    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    Product.find(findArgs)
        .select("-photo")
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};


exports.photo = async (req, res, next) => {
    if (req.product.photo.data) {
        res.set('Content-Type', req.product.photo.contentType)
        return res.send(req.product.photo.data)
    }
    next()
}

exports.listSearch = (req, res) => {
    //create query object to hold search value and category value
    const query = {}

    //assign search value to query.name
    if (req.query.search) {
        query.name = { $regex: req.query.search, $options: 'i' }
        //assign category value to value.category
        if (req.query.category && req.query.category !== 'All') {
            query.category = req.query.category
        }
        //find the product based on query object with 2 properties - search and category
        Product.find(query, (err, products) => {
            if (err) {
                return res.status(400).json({ error: errorHandler(err) })
            }
            res.json(products)
        }).select('-photo')
    }
}

exports.decreaseQuantity = async (req, res, next) => {
    let bulkOptions = req.body.order.products.map(item => {
        return {
            updateOne: {
                filter: { _id: item._id },
                update: { $inc: { quantity: -item.count, sold: +item.count } }
            }
        }
    })

    try {
        await Product.bulkWrite(bulkOptions, {})
        next()
    } catch (error) {
        return res.status(400).json({
            error: 'Could not update product'
        })
    }
}