import React from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3000');

function App() {
  const [gameState, setGameState] = React.useState({
    board: Array(9).fill(null),
    xIsNext: true,
  });
  const [question, setQuestion] = React.useState(null);
  const [options, setOptions] = React.useState([]);
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    socket.on('gameState', (state) => {
      setGameState(state);
      setErrorMsg('');
    });

    socket.on('askQuestion', ({ pergunta, opcoes }) => {
      console.log(opcoes);
      setQuestion(pergunta);
      setOptions(opcoes);
    });

    socket.on('wrongAnswer', (msg) => {
      setErrorMsg(msg);
    });

    return () => {
      socket.off('gameState');
      socket.off('askQuestion');
      socket.off('wrongAnswer');
    };
  }, []);

  const handleCellClick = (index) => {
    if (question) return;
    if (gameState.board[index]) return;
    socket.emit('makeMove', index);
  };

  const handleAnswer = (opcao) => {
    socket.emit('answerQuestion', opcao);
    setQuestion(null);
  };

  const renderCell = (index) => (
    <button
      className="cell"
      onClick={() => handleCellClick(index)}
      disabled={!!question}
    >
      {gameState.board[index]}
    </button>
  );

  return (
    <div className="App">
      <h1>Multiplayer Tic-Tac-Toe</h1>
      <div className="board">{[...Array(9)].map((_, i) => renderCell(i))}</div>
      <button onClick={() => socket.emit('restartGame')}>Restart Game</button>

      {question && (
        <div className="modal">
          <div className="modal-content">
            <h2>{question}</h2>
            <div className="options">
              {options.map((opt) => {
                return (
                  <button key={opt} onClick={() => handleAnswer(opt)}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {errorMsg && <p className="error">{errorMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
