import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';

import { publishMove, onMove } from './src/pubsub.js';
import { GameRoom } from './src/models/gameRoom.js';
import { getRandomQuestion } from './src/questions.js';
import { Board } from './src/models/board.js';
import { Player } from './src/models/player.js';

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

const rooms = new Map();
const pendingAnswers = new Map();

onMove(({ id, gameState }) => {
  const room = rooms.get(id);
  if (!room) return;

  const { playerA, playerB, board, aIsNext } = gameState;

  room.state = {
    playerA: new Player(playerA.id, playerA),
    playerB: new Player(playerB.id, playerB),
    board: new Board(board.boardSize, board.nPowerUps, board),
    aIsNext: aIsNext,
  };

  io.to(id).emit('gameState', room.state);
});

io.on('connection', (socket) => {
  // --- JOIN ROOM ---
  let room = [...rooms.values()].find((r) => !r.state.playerB);
  if (!room) {
    room = new GameRoom(rooms.size.toString(), socket.id);
    rooms.set(room.id, room);
    socket.emit('updateRoom', `Você criou a sala ${room.id}`);
  } else {
    room.join(socket.id);
    socket.emit('updateRoom', `Você entrou na sala ${room.id}`);
  }
  socket.join(room.id);
  io.in(room.id).emit('gameState', room.state);

  // --- MAKE MOVE ---
  socket.on('makeMove', (tileIndex) => {
    if (!room.canPlay(socket.id, tileIndex)) return;
    if (pendingAnswers.has(socket.id)) return;
    const currentPlayer =
      socket.id === room.state.playerA.id
        ? room.state.playerA
        : room.state.playerB;
    currentPlayer.chooseTile(tileIndex);

    const { question, options, correctAnswer } = getRandomQuestion();
    pendingAnswers.set(socket.id, {
      roomId: room.id,
      tileIndex,
      correctAnswer,
    });
    socket.emit('askQuestion', { question, options });
  });

  // --- ANSWER QUESTION ---
  socket.on('answerQuestion', (answer) => {
    const pend = pendingAnswers.get(socket.id);
    if (!pend) return;
    pendingAnswers.delete(socket.id);

    const result = answer !== pend.correctAnswer;

    // aplica a jogada
    room.applyMove(socket.id, pend.tileIndex, result);
    publishMove(room.id, room.state);
  });

  // --- RESTART ---
  socket.on('restartGame', () => {
    room.reset();
    publishMove(room.id, room.state);
  });

  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    pendingAnswers.delete(socket.id);

    const { playerA, playerB } = room.state;
    if (socket.id === playerA?.id) {
      room.state.playerA = undefined;
    }
    if (socket.id === playerB?.id) {
      room.state.playerB = undefined;
    }

    if (room.state.playerA || room.state.playerB) {
      io.to(room.id).emit('playerDisconnected', socket.id);
      io.to(room.id).emit('gameState', room.state);
    } else {
      rooms.delete(room.id);
    }
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.clear();
  console.log(`Server on port ${PORT}`);
});
