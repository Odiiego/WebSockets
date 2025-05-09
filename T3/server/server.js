import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const pubClient = createClient();
const subClient = createClient();
await pubClient.connect();
await subClient.connect();

let gameState = {
  board: Array(9).fill(null),
  xIsNext: true,
};

const players = {};

await subClient.subscribe('game-moves', (message) => {
  gameState = JSON.parse(message);
  io.emit('gameState', gameState);
});

function resetGame() {
  gameState = {
    board: Array(9).fill(null),
    xIsNext: true,
  };
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  if (!players.X) {
    players.X = socket.id;
    socket.emit('playerType', 'X');
  } else if (!players.O) {
    players.O = socket.id;
    socket.emit('playerType', 'O');
  } else {
    socket.emit('playerType', 'spectator');
  }

  socket.emit('gameState', gameState);

  socket.on('makeMove', (index) => {
    console.log('oi');
    if (
      (gameState.xIsNext && socket.id == players.O) ||
      (!gameState.xIsNext && socket.id == players.X) ||
      gameState.board[index] ||
      calculateWinner(gameState.board)
    )
      return;

    gameState.board[index] = gameState.xIsNext ? 'X' : 'O';
    gameState.xIsNext = !gameState.xIsNext;

    pubClient.publish('game-moves', JSON.stringify(gameState));
    io.emit('gameState', gameState);
  });

  socket.on('restartGame', () => {
    resetGame();
    io.emit('gameState', gameState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    if (players.X === socket.id) delete players.X;
    if (players.O === socket.id) delete players.O;
  });
});

function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 2, 4],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isBoardFull(board) {
  return board.every((cell) => cell != null);
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
