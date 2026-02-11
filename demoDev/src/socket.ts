import { io } from 'socket.io-client';

const URL = import.meta.env.DEV 
    ? 'http://orbitsground.local:5000' 
    : 'http://orbitsground.local/';

console.log('Socket.IO URL:', URL);
console.log('Environment:', import.meta.env.MODE);
console.log('DEV flag:', import.meta.env.DEV);

export const socket = io(URL, {
    transports: ['polling', 'websockets'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    autoConnect: true
});

socket.on('connect', () => console.log('✅ Socket connected'));
socket.on('disconnect', () => console.log('❌ Socket disconnected'));
socket.on('connect_error', (error) => console.error('❌ Socket error:', error));