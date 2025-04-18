const { prisma } = require('../config/prisma')

exports.create = async (req, res) => {
    try {
        const { title, description, price, quantity, categoryId, images  } = req.body
        const product = await prisma.product.create({
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {// 1 product มีได้หลาย image
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        })
        res.send(product)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.list = async (req, res) => {// ดึงข้อมูลสินค้าตามจำนวนที่ต้องการ (count)
    try {
        const { count } = req.params
        const products = await prisma.product.findMany({
            take: parseInt(count),
            orderBy: {// เรียงข้อมูลที่ส่งไปยังผู้ใช้แบบวันที่สร้างจากมากไปน้อย (ถูกเพิ่มล่าสุดอยู่ด้านบน)
                createdAt: "desc"
            },
            include: {// รวมถึง (สิ่งที่อยากได้เพิ่ม) หรือการ join table ของเรา
                category: true,
                images: true
            }
        })

        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.read = async (req, res) => {// ดึงข้อมูลสินค้าตาม id
    try {
        const { id } = req.params
        const product = await prisma.product.findFirst({
            where: {
                id: Number(id)
            },
            include: {
                category: true,
                images: true
            }
        })
        res.send(product)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.update = async (req, res) => {
    try {
        const { id } = req.params
        const { title, description, price, quantity, categoryId, images  } = req.body

        // clear images
        await prisma.image.deleteMany({
            where: {
                productId: Number(id)
            }
        })

        const product = await prisma.product.update({
            where: {
                id: Number(id),
            },
            data: {
                title: title,
                description: description,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                categoryId: parseInt(categoryId),
                images: {// 1 product มีได้หลาย image
                    create: images.map((item) => ({
                        asset_id: item.asset_id,
                        public_id: item.public_id,
                        url: item.url,
                        secure_url: item.secure_url
                    }))
                }
            }
        })
        res.send(product)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.remove = async (req, res) => {
    try {
        const { id } = req.params

        await prisma.product.delete({
            where: {
                id: Number(id)
            }
        })
        res.send('Delete Product Success')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.listby = async (req, res) => {// เรียงตาม order ที่ขายดีหรือใหม่ บลาๆ ที่ front-end ส่งมา 
    try {
        const { sort, order, limit } = req.body

        const products = await prisma.product.findMany({
            take: limit,
            orderBy: {[sort]: order},// เรียงตามที่ผู้ใช้ต้องการ
            include: {
                category: true
            }
        })
        
        console.log(sort, order, limit)
        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

const handleQuery = async (req, res, query) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                title: {
                    contains: query,// สิ่งที่เราพิมพ์ค้นหา
                }
            },
            include: {
                category: true,
                images: true
            }
        })
        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Search Error" })
    }
}

const handlePrice = async (req, res, priceRange) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                price: {// แสดงค่าที่อยู่ในช่วงแรกและสุดท้าย
                    gte: priceRange[0],// มากกว่า priceRange[0] และน้อยกว่า priceRange[1]
                    lte: priceRange[1]
                }
            },
            include: {
                category: true,
                images: true
            }
        })

        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Search Error" })
    }
}

const handleCategory = async (req, res, categoryId) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                categoryId: {// ต้นหาหมวดหมู่สินค้าหลายๆหมวดหมู่ที่ผู้ใช้เลือก
                    in: categoryId.map((id) => Number(id))
                }
            }, 
            include: {
                category: true,
                images: true
            }
        })

        res.send(products)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Search Error" })
    }
}

exports.searchFilters = async (req, res) => {// filters 3 อันคือ ค้นหาด้วยชื่อ, ราคา, หมวดหมู่
    try {
        const { query, category, price } = req.body
        if (query) {
            console.log('query:', query)
            await handleQuery(req, res, query)   
        }

        if (category) {
            console.log('categoory:', category)  
            await handleCategory(req, res, category) 
        }

        if (price) {
            console.log('price:', price)   
            await handlePrice(req, res, price)
        }
        
        // res.send('Hello Search Filters Product')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}