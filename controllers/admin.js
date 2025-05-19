const { prisma } = require('../config/prisma')

exports.changeOrderStatus = async (req, res) => {
    try {
        const { orderId, orderStatus } = req.body
        const orderUpdate = await prisma.order.update({
            where: { id: orderId },
            data: { orderStatus: orderStatus }
        }) 

        res.json({ ok: true, orderUpdate })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.getOrderAdmin = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                products: {
                    include: {
                        product: true
                    }
                },
                orderedBy: {
                    select: {
                        id: true,
                        email: true,
                        address: true
                    }
                }
            }
        })
        
        res.json({ ok: true, orders })
    } catch (err) {
        console.log(err)
        res.status(500).json({message: "Server Error"})
    }
}

exports.getDashboard = async (req, res) => {
    try {
        // ยอดขายทั้งหมด
        const totalRevenue = await prisma.order.aggregate({
            _sum: { amount: true },
        })

        // จน. orders ทั้งหมด
        const totalOrders = await prisma.order.count();

        // จน.สินค้าทั้งหมด

        // จน.สินค้าที่หมด (aggregate สรุปข้อมูล)
        const outofStockCount = await prisma.product.count({
            where: {
                quantity: 0,
            }
        })

        // สินค้าขายดีที่สุด (top 5)
        const topProducts = await prisma.product.findMany({
            orderBy: { sold: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                sold: true,
                price: true,
            }
        })

        // ยอดขายรายวัน (7 วันล่าสุด) เรียงข้อมูลจากมากไปน้อย
        const salesByDate = await prisma.$queryRaw`
            SELECT DATE("createdAt") as date, SUM("amount") as total
            FROM "Order"
            GROUP BY DATE("createdAt")
            ORDER BY date desc
            LIMIT 7;
        `;

        // ยอดขายรายเดือน 6 เดือนล่าสุด
        const salesByMonth = await prisma.$queryRaw`
            SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, SUM("amount") as total
            FROM "Order"
            GROUP BY month
            ORDER BY month desc
            LIMIT 6;
        `;

        const revence = Number(totalRevenue._sum.amount || 0)

        res.json({ 
            totalRevenue: revence,
            totalOrders,
            outofStockCount,
            topProducts,
            salesByDate: salesByDate.map((item => ({
                ...item,
                total: Number(item.total)
            }))),
            salesByMonth: salesByMonth.map((item) => ({
                ...item,
                total: Number(item.total)
            }))
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error"})
    }
}