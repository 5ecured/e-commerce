const User = require('../models/user')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
const { errorHandler } = require('../helpers/dbErrorHandler')

exports.signup = async (req, res) => {
    try {
        const user = new User(req.body)
        let saved = await user.save()

        saved.salt = undefined
        saved.hashed_password = undefined
        res.json({
            user: saved
        })
    } catch (error) {
        return res.status(400).json({
            error: errorHandler(error)
        })
    }
}

exports.signin = async (req, res) => {
    //find user based on email
    try {
        let user = await User.findOne({ email: req.body.email })
        //If user is found, make sure email and password match
        if (!user.authenticate(req.body.password)) {
            return res.status(401).json({
                error: 'Email and password do not match'
            })
        }

        //generate a signed token with user id and secret
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET)

        //persist token as 't' in cookie with expiry date
        res.cookie('t', token, { expire: new Date() + 9999 })

        //return the response with user and token to the frontend
        const { _id, name, email, role } = user
        return res.json({ token, user: { _id, name, email, role } })
    } catch (error) {
        if (error) {
            return res.status(400).json({
                error: 'User with that email does not exist'
            })
        }
    }
}

exports.signout = async (req, res) => {
    //just clear the cookie from the res object, the same cookie that was put in the res object when signing in above.
    res.clearCookie('t')
    return res.json({ message: 'Signout successful' })
}

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET,
    userProperty: 'auth'
})


//This isAuth function is for when we are logged in, but want to access other people's profile.
exports.isAuth = (req, res, next) => {
    //as a logged in user, req.profile is the profile we want to access. the target.
    //as a logged in user, req.auth is us. OUR profile.
    let user = req.profile && req.auth && req.profile._id == req.auth._id //notice double == not strict. if strict wont work

    //if we are signed in as profile 1, but want to access profile 2, we cannot, as "user" will be false
    if (!user) {
        return res.status(403).json({
            error: 'Access denied'
        })
    }
    next()
}

exports.isAdmin = (req, res, next) => {
    if (req.profile.role === 0) {
        return res.status(403).json({
            error: 'Admin access only'
        })
    }
    next()
}