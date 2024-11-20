const mongoose = require('mongoose')
const express=require('express')
const cors=require('cors');
const bodyParser = require('body-parser');
const router = require('./routes/routes');
const socketio=require('socket.io')
const PORT = 3000
const app=express();
const server=app.listen(4000)
const io=socketio(server,
    { pingTimeout:6000,
        cors:{
            origin:'http://localhost:5173'
        }
    }
)
require('dotenv').config()
require('./connection/connection')
app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(router)
app.use(express.json())


app.get('/',(req,res)=>{
    res.send('connected')
    
})

io.on("connection",(socket)=>{
    console.log('new connections')

    socket.on('joinRoom',(viewerid)=>{
        socket.join(viewerid)
        console.log('viewer joined single rool :', viewerid)
    }) 
    socket.on('joinChat',(_id)=>{
    socket.join(_id)
    console.log('user join chat room' ,_id)
   })
   socket.on('newMessage',(data,response)=>{
   response(data)
    console.log(data)
   })
})

app.listen(PORT)
