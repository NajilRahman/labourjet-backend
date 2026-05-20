require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./routes/routes');
const socketio = require('socket.io')
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3000
const app = express();
const server = http.createServer(app);

const io = socketio(server, {
    pingTimeout: 6000,
    cors: {
        origin: '*' // Allow all origins for seamless development integration
    }
})

// expose the io instance globally so controllers can emit events
global.io = io;

require('./connection/connection')

app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(router)

app.get('/', (req, res) => {
    res.send('connected')
})

const userSocketMap = {};

io.on("connection", (socket) => {
    console.log('new socket connection established')

    socket.on('joinRoom', (viewerid) => {
        socket.join(viewerid)
        userSocketMap[viewerid] = socket.id;
        console.log('viewer joined single room:', viewerid)
    }) 

    socket.on('joinChat', (_id) => {
        socket.join(_id)
        console.log('user joined chat room:', _id)
    })

    // WebRTC call signaling events
    socket.on('callUser', ({ userToCall, signalData, from, name }) => {
        // Forward the call signal to the callee
        io.to(userToCall).emit('callUser', { signal: signalData, from, name });
    });

    socket.on('answerCall', ({ to, signal }) => {
        io.to(to).emit('callAccepted', signal);
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
        io.to(to).emit('iceCandidate', candidate);
    });

    socket.on('newMessage', (data, response) => {
        if (response && typeof response === 'function') {
            response(data)
        }
        // Broadcast the message to all other users in the chat room (excluding sender)
        socket.to(data._id).emit('newMessageReceived', data)
        console.log('socket message sent to room:', data._id)
    })
})

server.listen(PORT, () => {
    console.log(`Unified server listening on port ${PORT}`)
})
