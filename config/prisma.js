// using connect DB
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

module.exports = { prisma } // ต้อง export เป็น object มี key ชื่อ prisma