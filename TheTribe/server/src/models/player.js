export class Player {
  constructor(id, data = {}) {
    this.id = id ?? data.id;
    this.counter = data.counter ?? 0;
    this.position = data.position ?? -1;
    this.coins = data.coins ?? {
      1: 1,
      2: 1,
      3: 1,
      4: 1,
      5: 1,
    };
  }

  getCoinValue(tileIndex) {
    return Math.abs(tileIndex - this.position);
  }

  checkMovement(tileIndex) {
    const coin = this.getCoinValue(tileIndex);
    return this.coins[coin] > 0;
  }

  chooseTile(tileIndex) {
    const coin = this.getCoinValue(tileIndex);
    if (!this.checkMovement(tileIndex)) return;
    this.coins[coin] -= 1;
  }

  responderPergunta(respostaCorreta, respostaUsuario) {
    this.respostaCorreta = respostaCorreta === respostaUsuario;
    return this.respostaCorreta;
  }

  makeMove(tileIndex, isCorrect) {
    this.counter++;
    if (this.counter % 5 === 0) {
      this.coins.refresh();
    }
    if (!isCorrect) return;

    this.position = tileIndex;
  }
}
