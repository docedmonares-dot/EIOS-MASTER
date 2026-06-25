require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const routes = require('./src/routes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('Real-time client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/', routes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`EIOS API running on port ${PORT}`);
});