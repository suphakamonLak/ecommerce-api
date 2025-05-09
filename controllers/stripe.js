const { prisma } = require('../config/prisma')
const stripe = require('stripe')('sk_test_51RM2YiRH21b9sie2wAQtej2yzuU9od73MuEw5gB6UkuVOlMTfvcZF65u6mQjbDcqiK7K3d2DgLBhhUPXzU8j7pBM004r9c6k8X');

exports.payment = async (req, res) => {
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: req.user.id
            }
        })
        console.log('cart', cart)
        const amountTHB = cart.cartTotal * 100// เนื่องจาก thb เป็นสตางค์

        // Create a paymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountTHB,
            currency: "thb",
            automatic_payment_methods: {
                enabled: true,
            },
        })

        res.send({
            clientSecret: paymentIntent.client_secret,
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}