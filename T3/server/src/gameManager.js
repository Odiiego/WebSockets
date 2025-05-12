import { getRandomQuestion } from './questions.js';
import { publishMove, onMove } from './pubsub.js';
import { isBoardFull, calculateWinner } from './helpers.js';

export class GameRoom {
  constructor(id, playerA) {
    this.id = id;
    this.playerA = playerA;
    this.playerB = null;
    this.reset();
  }

  reset() {
    this.state = { board: Array(9).fill(null), xIsNext: true };
  }

  isFull() {
    return !!this.playerA && !!this.playerB;
  }

  join(playerId) {
    if (!this.playerB) this.playerB = playerId;
  }

  canPlay(playerId, index) {
    const turnX = this.state.xIsNext;
    const isA = playerId === this.playerA;
    const isB = playerId === this.playerB;
    if (!this.isFull() || (!isA && !isB)) return false;
    if ((turnX && !isA) || (!turnX && !isB)) return false;
    if (this.state.board[index] !== null) return false;
    if (calculateWinner(this.state.board) || isBoardFull(this.state.board))
      return false;
    return true;
  }

  looseTurn() {
    this.state.xIsNext = !this.state.xIsNext;
  }

  applyMove(index) {
    const symbol = this.state.xIsNext ? 'X' : 'O';
    this.state.board[index] = symbol;
    this.state.xIsNext = !this.state.xIsNext;
  }
}
