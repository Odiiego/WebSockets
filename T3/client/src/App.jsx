import React from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3000');

function App() {
  const [gameState, setGameState] = React.useState({
    board: Array(9).fill(null),
    xIsNext: true,
    winner: null,
  });

  React.useEffect(() => {
    socket.on('gameState', (state) => {
      setGameState(state);
    });

    return () => socket.off('gameState');
  }, []);

  const handleClick = (index) => {
    if (gameState.board[index] || gameState.winner) return;
    socket.emit('makeMove', index);
  };

  const renderCell = (index) => (
    <button onClick={() => handleClick(index)}>{gameState.board[index]}</button>
  );

  return (
    <div>
      <h1>Multiplayer Tic-Tac-Toe</h1>
      <div className="board">{[...Array(9)].map((_, i) => renderCell(i))}</div>
      <button onClick={() => socket.emit('restartGame')}>Restart Game</button>
    </div>
  );
}

export default App;
