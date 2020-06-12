const User = require('../models/user')
const { errorHandler } = require('../helpers/dbErrorHandler')
const { Order } = require('../models/order')

exports.userById = async (req, res, next, id) => {
    try {
        let user = await User.findById(id)
        req.profile = user
        next()
    } catch (error) {
        return res.status(400).json({
            error: 'User not found'
        })
    }
}

exports.read = (req, res) => {
    req.profile.hashed_password = undefined
    req.profile.salt = undefined
    return res.json(req.profile)
}

exports.update = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate({ _id: req.profile._id }, { $set: req.body }, { new: true })
        user.hashed_password = undefined
        user.salt = undefined
        res.json(user)
    } catch (error) {
        return res.status(400).json({
            error: 'Not authorized to perform this'
        })
    }
}

exports.addOrderToUserHistory = async (req, res, next) => {
    let history = []

    try {
        req.body.order.products.forEach(item => {
            history.push({
                _id: item._id,
                name: item.name,
                description: item.description,
                category: item.category,
                quantity: item.count,
                transaction_id: req.body.order.transaction_id,
                amount: req.body.order.amount
            })
        })

        await User.findOneAndUpdate({ _id: req.profile._id }, { $push: { history: history } }, { new: true })
        next()
    } catch (error) {
        return res.status(400).json({
            error: 'Could not update user purchase history'
        })
    }
}

exports.purchaseHistory = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.profile._id }).populate('user', '_id name').sort('-created')
        return res.json(orders)
    } catch (error) {
        return res.status(400).json({
            error: errorHandler(error)
        })
    }
}