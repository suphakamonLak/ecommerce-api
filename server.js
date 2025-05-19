// step 1 import
const express = require('express')
const app = express()
const morgan = require('morgan')
const { readdirSync } = require('fs')// ใช้เอามาอ่านไดเรกทอรี
const cors = require('cors') // ให้ server กับ client ติดต่อกันได้

// const authRouter = require('./routes/auth')
// const categoryRouter = require('./routes/category')

// middleware
app.use(morgan('dev'))// dev, combined
app.use(express.json({limit: '20mb'}))// อนุญาตให้ส่งข้อมูลขนาดใหญ่
app.use(cors())// allow all

// app.use('/api', authRouter)
// app.use('/api', categoryRouter)
readdirSync('./routes')
    .map((c) => app.use('/api', require('./routes/' + c)) 
)

// step 3 Router
// app.post('/api', (req, res) => {
//     // code
//     const { username, password } = req.body// destructuring (แยกค่าออกจากออบเจกต์หรืออาร์เรย์)
//     console.log(username, password)// access values 
//     res.send('Jukkru')// ส่งออกไป
// })

// app.get('/', (req, res) => {
//   res.send('API is running!');
// });

// step 2 Start server
app.listen(5000, 
    () => console.log('Server is running on port 5000'))// port, callback function
