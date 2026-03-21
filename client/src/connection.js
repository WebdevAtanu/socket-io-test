import { io } from 'socket.io-client';

export function connection() {
    return io('http://localhost:3000');
}
