require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./routes/routes');
const socketio = require('socket.io')
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 5000
const app = express();
const server = http.createServer(app);

const io = socketio(server, {
    pingTimeout: 6000,
    cors: {
        origin: ['https://labourjetapi.stocksigo.com', 'https://labourjet.stocksigo.com', 'http://localhost:5173','http://localhost:3000'] // Restrict to production domains
    }
})

// expose the io instance globally so controllers can emit events
global.io = io;

require('./connection/connection')

app.use(cors({ origin: ['https://labourjetapi.stocksigo.com', 'https://labourjet.stocksigo.com', 'http://localhost:3000'], credentials: true }))
app.use(bodyParser.json({ limit: '10mb' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(router)

app.get('/', (req, res) => {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    
    // Status text & color mapping
    let dbStatus = 'Unknown';
    let dbPulseClass = 'status-connecting';
    
    if (dbState === 0) {
        dbStatus = 'Disconnected';
        dbPulseClass = 'status-disconnected';
    } else if (dbState === 1) {
        dbStatus = 'Connected';
        dbPulseClass = 'status-connected';
    } else if (dbState === 2) {
        dbStatus = 'Connecting';
        dbPulseClass = 'status-connecting';
    } else if (dbState === 3) {
        dbStatus = 'Disconnecting';
        dbPulseClass = 'status-disconnecting';
    }

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryStr = `${memoryUsage.toFixed(2)} MB`;

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LabourJet API - Status Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #080b11;
            --card-bg: rgba(17, 22, 34, 0.65);
            --card-border: rgba(255, 255, 255, 0.06);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --accent-green: #10b981;
            --accent-green-glow: rgba(16, 185, 129, 0.2);
            --accent-blue: #3b82f6;
            --accent-blue-glow: rgba(59, 130, 246, 0.2);
            --font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--font-family);
            background-color: var(--bg-color);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        /* Animated Mesh Background */
        .bg-mesh {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: -1;
            background-image: 
                radial-gradient(at 10% 20%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 90% 10%, rgba(139, 92, 246, 0.12) 0px, transparent 50%),
                radial-gradient(at 50% 80%, rgba(16, 185, 129, 0.1) 0px, transparent 50%);
            filter: blur(80px);
            opacity: 0.8;
            animation: animateBg 20s infinite alternate;
        }

        @keyframes animateBg {
            0% { transform: scale(1); }
            100% { transform: scale(1.1); }
        }

        .container {
            width: 100%;
            max-width: 650px;
            padding: 24px;
            perspective: 1000px;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--card-border);
            border-radius: 28px;
            padding: 40px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Glassmorphism reflection line */
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
            pointer-events: none;
        }

        /* Header Styles */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 24px;
        }

        .brand {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .brand h1 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .brand span {
            font-size: 13px;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .pulse-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 6px 14px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            color: var(--accent-green);
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: var(--accent-green);
            border-radius: 50%;
            box-shadow: 0 0 0 0 var(--accent-green-glow);
            animation: pulse 1.6s infinite;
        }

        @keyframes pulse {
            0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
                transform: scale(1);
                box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
            }
            100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
        }

        /* Status Grid */
        .status-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 32px;
        }

        @media (max-width: 500px) {
            .status-grid {
                grid-template-columns: 1fr;
            }
        }

        .status-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 20px;
            padding: 24px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .status-card:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .status-card .label {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 12px;
            letter-spacing: 0.3px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .status-card .value {
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Indicators colors */
        .indicator-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .status-connected {
            background-color: #10b981;
            box-shadow: 0 0 12px #10b981;
        }

        .status-connecting {
            background-color: #f59e0b;
            box-shadow: 0 0 12px #f59e0b;
            animation: blink 1s infinite alternate;
        }

        .status-disconnected {
            background-color: #ef4444;
            box-shadow: 0 0 12px #ef4444;
        }

        @keyframes blink {
            from { opacity: 0.4; }
            to { opacity: 1; }
        }

        /* Footer Details */
        .footer-details {
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .footer-details .item {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .footer-details strong {
            color: var(--text-primary);
        }

        /* SVG Icon styling */
        .icon {
            width: 16px;
            height: 16px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
    </style>
</head>
<body>
    <div class="bg-mesh"></div>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="brand">
                    <h1>LabourJet</h1>
                    <span>Backend API Gateway</span>
                </div>
                <div class="pulse-badge">
                    <div class="pulse-dot"></div>
                    Live
                </div>
            </div>

            <div class="status-grid">
                <!-- API Status Card -->
                <div class="status-card">
                    <div class="label">
                        <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                        API Server Status
                    </div>
                    <div class="value">
                        <div class="indicator-dot status-connected"></div>
                        Online
                    </div>
                </div>

                <!-- Database Status Card -->
                <div class="status-card">
                    <div class="label">
                        <svg class="icon" viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-2.239 10-5s-4.477-5-10-5-10 2.239-10 5 4.477 5 10 5z"></path><path d="M22 5c0 2.761-4.477 5-10 5S2 7.761 2 5s4.477-5 10-5 10 2.239 10 5z"></path><path d="M2 11c0 2.761 4.477 5 10 5s10-2.239 10-5"></path></svg>
                        Database Status
                    </div>
                    <div class="value">
                        <div class="indicator-dot ${dbPulseClass}"></div>
                        ${dbStatus}
                    </div>
                </div>

                <!-- Uptime Card -->
                <div class="status-card">
                    <div class="label">
                        <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Server Uptime
                    </div>
                    <div class="value" style="font-family: monospace; font-size: 18px; letter-spacing: -0.5px;">
                        ${uptimeStr}
                    </div>
                </div>

                <!-- Memory Usage Card -->
                <div class="status-card">
                    <div class="label">
                        <svg class="icon" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        Memory Allocation
                    </div>
                    <div class="value">
                        ${memoryStr}
                    </div>
                </div>
            </div>

            <div class="footer-details">
                <div class="item">
                    <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Node.js Version: <strong>${process.version}</strong>
                </div>
                <div class="item">
                    Environment: <strong>${process.env.NODE_ENV || 'development'}</strong>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `);
});

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
