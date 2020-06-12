const User = require('../models/user')
const braintree = require('braintree')
require('dotenv').config()

const gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY
})

exports.generateToken = (req, res) => {
    gateway.clientToken.generate({}, (err, response) => {
        if (err) {
            return res.status(500).send(err)
        } else {
            return res.send(response)
        }
    })
}

exports.processPayment = (req, res) => {
    let nonceFromTheClient = req.body.paymentMethodNonce
    let amountFromTheClient = req.body.amount

    //Charge the user
    let newTransaction = gateway.transaction.sale({
        amount: amountFromTheClient,
        paymentMethodNonce: nonceFromTheClient,
        options: {
            submitForSettlement: true
        }
    }, (error, result) => {
        if (error) {
            return res.status(500).json(error)
        } else {
            return res.json(result)
        }
    })
}