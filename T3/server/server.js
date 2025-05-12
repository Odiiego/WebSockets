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

const questions = [
  { pergunta: 'Quanto é 2+2?', opcoes: ['3', '4', '5'], respostaCorreta: '4' },
  {
    pergunta: 'Capital do Brasil?',
    opcoes: ['Rio', 'Brasília', 'São Paulo'],
    respostaCorreta: 'Brasília',
  },
];

const salas = {};

const pendingQuestions = {
  // { salaId, index, respostaCorreta }
};

await subClient.subscribe('game-moves', (message) => {
  const payload = JSON.parse(message);
  const { id, gameState } = payload;
  if (salas[id]) {
    salas[id].gameState = gameState;
  }
  io.to(id).emit('gameState', gameState);
});

const defaultGameState = () => ({ board: Array(9).fill(null), xIsNext: true });

function resetGame(sala) {
  sala.gameState = defaultGameState();
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  let salaId;
  const disponivel = Object.values(salas).find((s) => !s.playerB);

  if (disponivel) {
    salaId = disponivel.id;
    disponivel.playerB = socket.id;
  } else {
    salaId = Object.keys(salas).length.toString();
    salas[salaId] = {
      id: salaId,
      playerA: socket.id,
      playerB: null,
      gameState: defaultGameState(),
    };
  }
  socket.join(salaId);

  const sala = salas[salaId];
  socket.emit(
    'updateRoom',
    disponivel
      ? `Você entrou na sala ${salaId}`
      : `Você criou a sala ${salaId}`,
  );

  socket.emit('gameState', salas[salaId].gameState);

  socket.on('makeMove', (index) => {
    const sala = salas[salaId];
    const state = sala.gameState;

    const isPlayerA = socket.id === sala.playerA;
    const isPlayerB = socket.id === sala.playerB;
    const turnX = state.xIsNext;

    if (!sala.playerA || !sala.playerB) return;
    if (!isPlayerA && !isPlayerB) return;
    if ((turnX && !isPlayerA) || (!turnX && isPlayerA)) return;
    if (state.board[index] !== null) return;
    if (calculateWinner(state.board) || isBoardFull(state.board)) return;
    if (pendingQuestions[sala.playerA] || pendingQuestions[sala.playerB])
      return;

    const q = questions[Math.floor(Math.random() * questions.length)];
    pendingQuestions[socket.id] = {
      salaId,
      index,
      respostaCorreta: q.respostaCorreta,
    };
    socket.emit('askQuestion', { pergunta: q.pergunta, opcoes: q.opcoes });
  });

  socket.on('answerQuestion', (resposta) => {
    const pending = pendingQuestions[socket.id];
    if (!pending) return;
    const { salaId, index, respostaCorreta } = pending;
    delete pendingQuestions[socket.id];

    const sala = salas[salaId];
    const state = sala.gameState;
    state.xIsNext = !state.xIsNext;

    if (resposta == respostaCorreta) {
      state.board[index] = state.xIsNext ? 'X' : 'O';
    } else {
      return socket.emit('wrongAnswer', 'Resposta incorreta!');
    }

    pubClient.publish(
      'game-moves',
      JSON.stringify({ id: salaId, gameState: state }),
    );
    io.to(salaId).emit('gameState', state);
  });

  socket.on('restartGame', () => {
    const sala = salas[salaId];
    resetGame(sala);
    pubClient.publish(
      'game-moves',
      JSON.stringify({ id: salaId, gameState: sala.gameState }),
    );
    io.to(salaId).emit('gameState', sala.gameState);

    pubClient.publish(
      'game-moves',
      JSON.stringify({ id: salaId, gameState: sala.gameState }),
    );
    io.to(salaId).emit('gameState', sala.gameState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    const sala = salas[salaId];
    if (!sala) return;
    if (sala.playerA === socket.id) sala.playerA = null;
    if (sala.playerB === socket.id) sala.playerB = null;
    if (!sala.playerA && !sala.playerB) delete salas[salaId];
  });
});

function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
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
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
