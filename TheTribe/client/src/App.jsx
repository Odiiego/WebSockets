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
  const [oponent, setOponent] = React.useState();
  const [gameState, setGameState] = React.useState();
  const [question, setQuestion] = React.useState(null);
  const [options, setOptions] = React.useState([]);
  const [canAnswer, setCanAnswer] = React.useState(false);
  const [lastResult, setLastResult] = React.useState(null);

  React.useEffect(() => {
    socket.on('gameState', (state) => {
      setGameState(state);
      setPlayer(
        socket.id === state.playerA.id
          ? { name: 'playerA', ...state.playerA }
          : { name: 'playerB', ...state.playerB },
      );
      setOponent(
        socket.id !== state.playerA.id
          ? { name: 'playerA', ...state.playerA }
          : { name: 'playerB', ...state.playerB },
      );
      setCanAnswer(false);
    });

    socket.on(
      'askQuestion',
      ({
        question,
        options,
        canAnswer,
        // currentPlayerId,
      }) => {
        setQuestion(question);
        setOptions(options);
        setCanAnswer(canAnswer);
      },
    );

    socket.on('questionResult', ({ playerId, correct }) => {
      // identifica se foi você ou o adversário
      const who = playerId === socket.id ? 'Você' : 'O adversário';
      setLastResult(
        `${who} ${
          correct
            ? `acertou ${who == 'Você' ? '🎉' : '😢'}`
            : `errou ${who == 'Você' ? '😢' : '🎉'}`
        }`,
      );

      // limpa pergunta e estado de resposta
      setTimeout(() => {
        setLastResult(null);
        setQuestion(null);
        setOptions([]);
        setCanAnswer(false);
      }, 1000);
    });

    return () => {
      socket.off('gameState');
      socket.off('askQuestion');
      socket.off('questionResult');
    };
  }, []);

  const handleClick = (tileIndex) => {
    socket.emit('makeMove', tileIndex);
  };

  const handleAnswer = (opcao) => {
    if (!canAnswer) return;
    socket.emit('answerQuestion', opcao);
  };

  return (
    <div className="App">
      {gameState ? (
        <div className={styles.container}>
          <div className={styles.playersContainer}>
            <div className={styles.player}>
              <span>
                <h2 className={styles.playerName}>{player.name}</h2>
                <div className={styles.playerCoins}>
                  {Object.entries(player.coins).flatMap(([value]) => (
                    <button key={`${value}`} className={styles.coin}>
                      {value}
                    </button>
                  ))}
                </div>
              </span>
              <span className={styles.playerIcon}>
                {player.name === 'playerA' ? '🐭' : '🦊'}
              </span>
            </div>
          </div>
          <div
            className={`${styles.tabuleiro} ${styles[gameState.board.shape]}`}
          >
            {gameState.board.tiles.map((tile, n) => (
              <div key={n} className={styles.casa}>
                {tile.theme.map((theme) => (
                  <span
                    key={theme}
                    onClick={() => handleClick(n)}
                    className={styles[tile[theme]]}
                  >
                    {gameState.playerA.position == n &&
                    gameState.playerB.position == n
                      ? '🐭🦊'
                      : gameState.playerA.position == n
                      ? '🐭'
                      : gameState.playerB?.position == n
                      ? '🦊'
                      : temas[theme]}
                    {tile.hasPowerUp ? '⭐' : ''}
                  </span>
                ))}
              </div>
            ))}
            <div className={styles.question}>
              {question && <h2>{question}</h2>}
              {lastResult && <div className={styles.toast}>{lastResult}</div>}
            </div>
            <div className={styles.options}>
              {question &&
                options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={!canAnswer}
                  >
                    {opt}
                  </button>
                ))}
            </div>
          </div>
          {oponent ? (
            <div className={styles.playersContainer}>
              <div className={`${styles.player} ${styles.oponent}`}>
                <span className={styles.playerIcon}>
                  {oponent.name === 'playerA' ? '🐭' : '🦊'}
                </span>
                <span>
                  <h2 className={styles.playerName}>{oponent.name}</h2>
                  <div className={styles.playerCoins}>
                    {Object.entries(oponent.coins).flatMap(([value]) => (
                      <button key={`${value}`} className={styles.coin}>
                        {value}
                      </button>
                    ))}
                  </div>
                </span>
              </div>
            </div>
          ) : (
            <p>Aguardando o segundo Jogador</p>
          )}
        </div>
      ) : (
        'Carregando'
      )}
    </div>
  );
}

export default App;
