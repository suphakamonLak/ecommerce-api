const { prisma } = require('../config/prisma')
const cloudinary = require('cloudinary').v2

// Cloudinary img
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // เข้าถึงตัวแปรที่ set ค่าในไฟล์ .env
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
})

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
        // Step 1 find product
        const products = await prisma.product.findFirst({
            where: { id: Number(id) },
            include: { images: true }
        })
        if (!products) {
            return res.status(400).json({ message: "Product not found!" })
        }
        // Step 2 promiss (ลบแบบรอ) ลบรูปภาพใน cloudinary
        const deletedImage = products.images.map((img => 
            new Promise((resolve, reject) => {
                // Delete from cloudinary
                cloudinary.uploader.destroy(img.public_id, (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                })
            })
        ))

        await Promise.all(deletedImage)
        // Step 3 delete product
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
            await handleQuery(req, res, query)   
        }

        if (category) {
            await handleCategory(req, res, category) 
        }

        if (price) {
            await handlePrice(req, res, price)
        }
        
        // res.send('Hello Search Filters Product')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.createImages = async (req, res) => {
    try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.body.image, {
            public_id: `${Date.now()}`,
            resource_type: 'auto',
            folder: 'Ecom2025'
        })
        res.send(result)
    } catch(err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}
exports.removeImage = async (req, res) => {
    try {
        const { public_id } = req.body
        // Send to cloudinary
        cloudinary.uploader.destroy(public_id, (result) => {
            res.send('Remove image success')
        })
    } catch(err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}