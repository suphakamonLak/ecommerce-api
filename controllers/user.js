const { prisma } = require('../config/prisma')

exports.listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                enable: true,
                address: true
            }
        })
        res.json(users)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.changeStatus = async (req, res) => {// เปลี่ยนสถานะของผู้ใช้งาน
    try {
        const { id, enabled } = req.body
        const  user = await prisma.user.update({
            where:{ id: Number(id) },
            data: { enable: enabled }
        })

        res.send('Update Status Success')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.ChangeRole = async (req, res) => {
    try {
        const { id, role } = req.body
        const  user = await prisma.user.update({
            where:{ id: Number(id) },
            data: { role: role }
        })

        res.send('Update Role Success')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.userCart = async (req, res) => {// เพิ่มข้อมูลลงตะกร้าสินค้า
    try {
        const { cart } = req.body

        console.log(cart)
        console.log(req.user.id)

        const user = await prisma.user.findFirst({
            where: { id: Number(req.user.id) }
        })

        // check quantity
        for (const item of cart) {
            const product = await prisma.product.findUnique({// หาสินค้าด้วยข้อมูลที่ลูป ว่าจน.ที่จะซื้อมันมีมากกว่าหรือน้อยกว่าในคลังหรือไม่
                where: { id: item.id },
                select: { quantity: true, title: true }
            })
            
            // console.log("item", item)
            // console.log("product", product)
            if (!product || item.count > product.quantity) { // ถ้าจน.ที่ซื้อมีมากกว่าในคลัง
                return res.status(400).json({ 
                    ok: false, 
                    message: `ขออภัย สินค้า${product?.title || 'สินค้า'} หมด!`
                })
            }
        }

        // delete old cart item เพื่อเพิ่มสินค้าใหม่เข้าไป
        await prisma.productOnCart.deleteMany({
            where: {
                cart: { // ตะกร้าของใคร
                    orderedById: user.id
                }
            }
        })

        // delete old cart
        await prisma.cart.deleteMany({
            where: { orderedById: user.id }
        })

        // เตรียมสินค้า
        let products = cart.map((item) => ({
            productId: item.id,
            count: item.count,
            price: item.price
        }))

        // คำนวณหาผลรวม (sum, item) = ผลรวม, current value
        let cartTotal = products.reduce((sum, item) => 
            sum + item.price * item.count, 0)

        // new cart
        const newCart = await prisma.cart.create({
            data: {
                products: {
                    create: products
                },
                cartTotal: cartTotal,
                orderedById: user.id
            }
        })
        // console.log('newCart', newCart)
        // console.log('cartTotal', cartTotal)
        res.send('Add Cart OK')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getUserCart = async (req, res) => {// ดึงข้อมูลออกจากตะกร้า
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                orderedById: Number(req.user.id)
            },
            include: {
                products: { // products หลายอันที่อยู่ในตะกร้า
                    include: {
                        product: true // เพื่อเอารายละเอียดสินค้าไปแสดง
                    }
                }
            }
        })
        console.log(cart)

        res.json({
            products: cart.products,
            cartTotal: cart.cartTotal
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.emptyCart = async (req, res) => { // ใช้เคลียร์ข้อมูลในตะกร้าสินค้า
    try {
        const cart = await prisma.cart.findFirst({
            where: { orderedById: Number(req.user.id) }
        })
        if (!cart) {
            return res.status(400).json({ message: "No cart"})
        }

        // ลบสินค้าในตะกร้า (cart) 
        await prisma.productOnCart.deleteMany({
            where: { cartId: cart.id }
        })

        // delete old cart
        const result = await prisma.cart.deleteMany({
            where: { orderedById: Number(req.user.id) }
        })

        console.log("result", result)
        res.json({
            message: "Cart Empty Success",
            deletedCount: result.count // ลบไปกี่ order
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.saveAddress = async (req, res) => { // ใช้เคลียร์ข้อมูลในตะกร้าสินค้า
    try {
        const { address } = req.body
        const addressUser = await prisma.user.update({
            where:{ id: Number(req.user.id) },
            data: {
                address: address
            }
        })

        console.log(addressUser)
        res.json({ ok: true, message: "Update Success"})
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.saveOrder = async (req, res) => { // ใช้เคลียร์ข้อมูลในตะกร้าสินค้า
    try {
        const { id, amount, status, currency } = req.body.paymentIntent
        // get user cart
        const userCart = await prisma.cart.findFirst({
            where: { 
                orderedById: Number(req.user.id)
            },
            include: { products: true }
        })

        // check empty
        if (!userCart || userCart.products.length === 0) {
            return res.status(400).json({ message: "Cart is Empty"})
        }

        // Create a new Order
        const amountTHB = Number(amount) / 100 // เพื่อเก็บค่าสกุลที่เป็นสตางค์
        const order = await prisma.order.create({
            data: {// เพิ่มลงในตารางหลัก
                products: {// เพิ่มลงในตาราง one-to-many
                    create: userCart.products.map((item) => ({
                        productId: item.productId,
                        count: item.count,
                        price: item.price
                    }))
                },
                orderedBy: {// เชื่อมตาราง order กับ user เพื่อหาว่าเป็น order ของใคร
                    connect: { id: req.user.id }
                },
                cartTotal: userCart.cartTotal,
                stripePaymentId: id,
                amount: Number(amountTHB),
                status: status,
                currency: currency,
            },
        })

        // Update product
        const update = userCart.products.map((item) => ({
            where: { id: item.productId },
            data: {
                quantity: { decrement: item.count },// ลดจน.สินค้าตามที่ซื้อ
                sold: { increment: item.count }// เพิ่มจน.ตามที่ขายได้
            }
        }))

        await Promise.all(// รอทั้งหมดในการอัพเดตในตะกร้าสินค้า
            update.map((updated) => prisma.product.update(updated))
        )
        // ลบในตะกร้าสินค้า
        await prisma.cart.deleteMany({
            where: { orderedById: Number(req.user.id) }
        })

        res.json({ok: true, message: order})
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getOrder = async (req, res) => { // ใช้เคลียร์ข้อมูลในตะกร้าสินค้า
    try {
        const orders = await prisma.order.findMany({
            where: { orderedById: Number(req.user.id) },
            include: {
                products: {
                    include: {
                        product: true
                    }
                }
            }
        })
        if (orders.length === 0) {
            return res.status(400).json({ok: false, message: "No order"})
        }

        res.json({ok: true, orders})
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}