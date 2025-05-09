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
  const [player, setPlayer] = React.useState(undefined);

  React.useEffect(() => {
    socket.on('gameState', (state) => {
      setGameState(state);
    });

    socket.on('playerType', (type) => {
      setPlayer(type);
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
      {player ? <h2>Jogador: {player}</h2> : ''}
      {gameState.xIsNext && player == 'X' ? 'Seu Vez' : ''}
      {!gameState.xIsNext && player == 'O' ? 'Seu Vez' : ''}
      <div className="board">{[...Array(9)].map((_, i) => renderCell(i))}</div>
      <button onClick={() => socket.emit('restartGame')}>Restart Game</button>
    </div>
  );
}

export default App;
