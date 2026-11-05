const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const users = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('register', (userId) => {
    users.set(userId, socket.id);
    socket.userId = userId;
    socket.emit('registered', { userId, socketId: socket.id });
  });

  socket.on('offer', (data) => {
    const targetSocketId = users.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', {
        callerUserId: data.callerUserId,
        offer: data.offer
      });
    }
  });

  socket.on('answer', (data) => {
    const targetSocketId = users.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', {
        responderUserId: socket.userId,
        answer: data.answer
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    const targetSocketId = users.get(data.targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        senderUserId: socket.userId,
        candidate: data.candidate
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      users.delete(socket.userId);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
