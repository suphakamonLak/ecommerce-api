const express = require('express')
const app = express()
const morgan = require('morgan')
const { readdirSync } = require('fs')
const cors = require('cors') 

// middleware
app.use(morgan('dev'))// dev, combined
app.use(express.json({limit: '20mb'}))// อนุญาตให้ส่งข้อมูลขนาดใหญ่
app.use(cors())// allow all

readdirSync('./routes')
    .map((c) => app.use('/api', require('./routes/' + c)) 
)


// step 2 Start server
app.listen(5000, 
    () => console.log('Server is running on port 5000'))// port, callback function
