import { Board } from './board.js';
import { Player } from './player.js';

export class GameRoom {
  constructor(id, playerAId) {
    this.id = id;
    this.state = {
      playerA: new Player(playerAId),
      playerB: undefined,
      board: new Board(31, 5),
      aIsNext: true,
    };
  }

  reset() {
    this.state.board = new Board(31, 5);
    this.state.aIsNext = true;
  }

  join(playerId) {
    if (!this.state.playerB) {
      this.state.playerB = new Player(playerId);
    }
  }

  isFull() {
    return Boolean(this.state.playerB);
  }

  canPlay(playerId, tileIndex) {
    // const currentPlayer =
    //   playerId === this.state.playerA.id
    //     ? this.state.playerA
    //     : this.state.playerB;
    // VERIFICAR SE O JOGADOR TEM A MOEDA DESEJADA
    if (!this.state.playerB) return false;
    const isA = playerId === this.state.playerA.id;
    const isB = playerId === this.state.playerB.id;
    if (!isA && !isB) return false;
    if ((this.state.aIsNext && !isA) || (!this.state.aIsNext && !isB)) {
      return false;
    }

    return true;
  }

  endTurn() {
    this.state.aIsNext = !this.state.aIsNext;
  }

  applyMove(playerId, tileIndex, isCorrect) {
    const currentPlayer =
      playerId === this.state.playerA.id
        ? this.state.playerA
        : this.state.playerB;
    currentPlayer.makeMove(tileIndex, isCorrect);
    this.endTurn();
  }
}
