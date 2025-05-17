import React from 'react';
import io from 'socket.io-client';
import styles from './App.module.scss';

const temas = [
  'S', // sociedade
  'V', // variedades
  'M', // mundo
  'EL', // esporte
  'CT', // cienciaTecnologia
  'AE', // artesEntretenimento
];

const socket = io('http://localhost:3000');

function App() {
  const [player, setPlayer] = React.useState();
  const [gameState, setGameState] = React.useState(undefined);
  const [question, setQuestion] = React.useState(null);
  const [options, setOptions] = React.useState([]);

  React.useEffect(() => {
    socket.on('gameState', (state) => {
      setGameState(state);
      setPlayer(socket.id === state.playerA.id ? 'playerA' : 'playerB');
    });

    socket.on('askQuestion', ({ question, options }) => {
      setQuestion(question);
      setOptions(options);
    });

    return () => {
      socket.off('gameState');
      socket.off('askQuestion');
    };
  }, []);

  const handleClick = (tileIndex) => {
    socket.emit('makeMove', tileIndex);
  };

  const handleAnswer = (opcao) => {
    socket.emit('answerQuestion', opcao);
    setQuestion(null);
  };

  return (
    <div className="App">
      {gameState && (
        <div>
          <h1>{player}</h1>
        </div>
      )}
      {gameState ? (
        <div className={styles.container}>
          <div className={styles.mesa}>
            <div
              className={`${styles.tabuleiro} ${styles[gameState.board.shape]}`}
            >
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
                  </div>
                </div>
              )}
              {gameState.board.tiles.map((tile, n) => (
                <div key={n} className={styles.casa}>
                  {tile.theme.map((theme) => (
                    <span
                      key={theme}
                      onClick={() => handleClick(n)}
                      className={styles[tile[theme]]}
                    >
                      {gameState.playerA.position == n
                        ? '🐭'
                        : gameState.playerB?.position == n
                        ? '🦊'
                        : temas[theme]}
                      {tile.hasPowerUp ? '⭐' : ''}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        'Carregando'
      )}
    </div>
  );
}

export default App;
