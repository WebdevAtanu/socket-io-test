import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // allow all origins
    },
});
const ROOM = 'group';

io.on('connection', (socket) => {
    console.log('a user connected with socket id: ', socket.id);

    // join room
    socket.on('joinRoom', async (userName) => {
        console.log(`${userName} is joining to the room.`);

        socket.userName = userName;
        socket.join(ROOM);

        // send to all including sender
        // io.to(ROOM).emit('roomNotice', userName);

        // send to all excluding sender
        socket.to(ROOM).emit('roomNotice', userName);
    });

    socket.on('chatMessage', (msg) => {
        socket.to(ROOM).emit('chatMessage', msg);
    });

    socket.on('typing', (userName) => {
        socket.to(ROOM).emit('typing', userName);
    });

    socket.on('stopTyping', (userName) => {
        socket.to(ROOM).emit('stopTyping', userName);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
    });
});

app.get('/', (_, res) => {
    res.send('<h1>Socket API is running</h1>');
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
