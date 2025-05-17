export class Coin {
  constructor(init) {
    if (init instanceof Coin) {
      this.coins = { ...init.coins };
    } else if (init && init.coins) {
      this.coins = { ...init.coins };
    } else {
      this.coins = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 };
    }
  }

  check(face) {
    // this.validate(face);
    return this.coins[face] > 0;
  }

  add(face, qty = 1) {
    // this.validateFace(face);
    this.coins[face] += qty;
  }

  remove(face, qty = 1) {
    // this.validateFace(face);
    if (this.coins[face] < qty) {
      throw new Error(`Not enough coins of face ${face}`);
    }
    this.coins[face] -= qty;
    return face;
  }

  refresh() {
    Object.keys(this.coins).forEach((f) => {
      this.coins[+f]++;
    });
  }

  validate(face) {
    if (!Object.prototype.hasOwnProperty.call(this.coins, face)) {
      throw new Error(`Invalid coin face: ${face}`);
    }
  }
}
