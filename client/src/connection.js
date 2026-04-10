import { io } from 'socket.io-client';

export function connection() {
    const uri = import.meta.env.VITE_SOCKET_URL;
    return io(uri);
}
