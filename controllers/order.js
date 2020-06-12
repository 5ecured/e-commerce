const { Order, CartItem } = require('../models/order')
const { errorHandler } = require('../helpers/dbErrorHandler')

exports.orderById = async (req, res, next, id) => {
    try {
        const order = await Order.findById(id).populate('products.product', 'name price')
        req.order = order
        next()
    } catch (error) {
        return res.status(400).json({
            error: errorHandler(error)
        })
    }
}

exports.create = async (req, res) => {
    try {
        req.body.order.user = req.profile
        const order = new Order(req.body.order)
        const data = await order.save()
        return res.json(data)
    } catch (error) {
        return res.status(400).json({
            error: errorHandler(error)
        })
    }
}

exports.listOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', '_id name address')
            .sort('-created')

        return res.json(orders)
    } catch (error) {
        return res.status(400).json({
            error: errorHandler(error)
        })
    }
}

exports.getStatusValues = async (req, res) => {
    return res.json(Order.schema.path('status').enumValues)
}

exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.update({ _id: req.body.orderId }, { $set: { status: req.body.status } })
        return res.json(order)
    } catch (error) {
        return res.status(400).json({
            error: errorHandler(error)
        })
    }
}