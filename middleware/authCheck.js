const jwt = require('jsonwebtoken')
const { prisma } = require('../config/prisma')

exports.authCheck = async (req, res, next) => {
    try {
        // verify token
        const headerToken = req.headers.authorization
        if (!headerToken) {
            return res.status(401).json({ message: "No token, Authorization" })
        }
        const token = headerToken.split(" ")[1]
        const decode = jwt.verify(token, process.env.SECRET)// ถอดรหัส
        req.user = decode // เพิ่ม property เข้าไปใน req เพื่อจะใช้เข้าถึงในทุกๆหน้า

        const user = await prisma.user.findFirst({// check in DB
            where: {
                email: req.user.email
            }
        })
        if (!user.enable) {
            return res.status(400).json({ message: "This account can't access"})
        }
        console.log('Hello middleware')
        next()// ไปทำอย่างอื่นต่อ
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Token Invalid" })
    }
}

exports.adminCheck = async (req, res, next) => {
    try {
        const { email } = req.user
        const adminUser = await prisma.user.findFirst({
            where: {
                email: email
            }
        })
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: Admin Only"})
        }
        next()
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Error Admin access denied" })
    }
}