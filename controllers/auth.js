const { prisma } = require('../config/prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.register = async (req, res) => {// function 
    try {
        const { email, password } = req.body
        console.log(req.body)
        
        // step 1 Validate body
        if (!email) {
            return res.status(400).json({message: "Email is require!"})
        }
        if (!password) {
            return res.status(400).json({ message: "Password is require"})
        }

        // step 2 Check email in DB already ?
        const user = await prisma.user.findFirst({// หา user คนเดียว
            where: {// สิ่งที่เราจะค้นหา
                email: email
            }
        })
        if (user) {
            return res.status(400).json({ message: "Email already exits!"})
        }

        // step 3 Hash password
        const hashPassword = await bcrypt.hash(password, 10)
        
        // step 4 Register
        await prisma.user.create({
            data: {// ข้อมูลที่จะเพิ่มใน DB
                email: email,
                password: hashPassword
            }
        })

        res.send('Register successful')
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        // step 1 Check email
        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        })
        if (!user || !user.enable) {
            return res.status(400).json({ message: "User not found or not enable!" })
        }
        // step 2 Check password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            res.status(400).json({ message: "Password Invalid!" })
        }
        // step 3 Create payload (data)
        const payload = {// สร้างออบเจกต์เพื่อจะเอาไปใส่รหัส token
            id: user.id,
            email: user.email,
            role: user.role
        }
        // step 4 Generate token
        jwt.sign(// ข้อมูลที่ต้องการจะสร้างรหัส, secretKey, options, token
            payload, 
            process.env.SECRET, 
            { expiresIn: '1d' }, 
            (err, token) => {
                if (err) return res.status(500).json({ message: "Server Error"})
                
                res.json({ payload, token })
            }
        )
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}

exports.currentUser = async (req, res) => {
    try {
        const user = await prisma.user.findFirst({
            where: { email: req.user.email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        })

        res.json({ user })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Server Error" })
    }
}