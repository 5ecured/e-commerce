require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const expressValidator = require('express-validator')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const categoryRoutes = require('./routes/category')
const productRoutes = require('./routes/product')
const braintreeRoutes = require('./routes/braintree')
const orderRoutes = require('./routes/order')

//db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(() => {
    console.log('DB connected')
})

//middleware
app.use(express.json())
app.use(cookieParser())
app.use(expressValidator())
app.use(cors())



//routes middleware
app.use('/api', authRoutes)
app.use('/api', userRoutes)
app.use('/api', categoryRoutes)
app.use('/api', productRoutes)
app.use('/api', braintreeRoutes)
app.use('/api', orderRoutes)

const port = process.env.PORT || 8000

app.listen(port, () => {
    console.log(`running on ${port}`)
})