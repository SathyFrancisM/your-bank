import { io } from 'socket.io-client';

let socket;

export const connectSocket = (token) => {
  if (socket) {
    return socket;
  }
  socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
    transports: ['websocket'],
    auth: { token }
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
