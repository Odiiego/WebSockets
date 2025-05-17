import { Tile } from './tile.js';

export class Board {
  constructor(boardSize, nPowerUps, data = {}) {
    this.boardSize = data.boardSize ?? boardSize;
    this.nPowerUps = data.nPowerUps ?? nPowerUps;
    this.tiles = data.tiles ?? this.initTiles();
    this.shape = 'quadrado';
  }

  initTiles() {
    const powerUpIndices = this.getUniqueRandomIndices(
      this.nPowerUps,
      this.boardSize,
    );
    return Array.from(
      { length: this.boardSize },
      (_, i) => new Tile(powerUpIndices.includes(i)),
    );
  }

  getUniqueRandomIndices(n, max) {
    const indices = new Set();
    while (indices.size < n) {
      indices.add(Math.floor(Math.random() * max));
    }
    return [...indices];
  }
}
