import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';

import { GameRoom } from './src/gameManager.js';
import { getRandomQuestion } from './src/questions.js';
import { publishMove, onMove } from './src/pubsub.js';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  }),
);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const rooms = new Map(); // roomId → GameRoom
const pendingAnswers = new Map(); // socketId → { roomId, index, correct }

onMove(({ id, gameState }) => {
  const room = rooms.get(id);
  if (room) {
    room.state = gameState;
    io.to(id).emit('gameState', gameState);
  }
});

io.on('connection', (socket) => {
  // --- JOIN ROOM ---
  let room = [...rooms.values()].find((r) => !r.playerB);
  if (!room) {
    room = new GameRoom(rooms.size.toString(), socket.id);
    rooms.set(room.id, room);
    socket.emit('updateRoom', `Você criou a sala ${room.id}`);
  } else {
    room.join(socket.id);
    socket.emit('updateRoom', `Você entrou na sala ${room.id}`);
  }
  socket.join(room.id);
  socket.emit('gameState', room.state);

  // --- MAKE MOVE ---
  socket.on('makeMove', (index) => {
    if (!room.canPlay(socket.id, index)) return;
    if (pendingAnswers.has(socket.id)) return;

    const { pergunta, opcoes, respostaCorreta } = getRandomQuestion();
    pendingAnswers.set(socket.id, { roomId: room.id, index, respostaCorreta });
    socket.emit('askQuestion', { pergunta, opcoes });
  });

  // --- ANSWER QUESTION ---
  socket.on('answerQuestion', (resposta) => {
    const pend = pendingAnswers.get(socket.id);
    if (!pend) return;
    pendingAnswers.delete(socket.id);

    if (resposta !== pend.respostaCorreta) {
      room.looseTurn();
      return socket.emit('wrongAnswer', 'Resposta incorreta!');
    }

    // aplica a jogada
    room.applyMove(pend.index);
    publishMove(room.id, room.state);
  });

  // --- RESTART ---
  socket.on('restartGame', () => {
    room.reset();
    publishMove(room.id, room.state);
  });

  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    if (socket.id === room.playerA) room.playerA = null;
    if (socket.id === room.playerB) room.playerB = null;
    if (!room.playerA && !room.playerB) rooms.delete(room.id);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
