export class Tile {
  constructor(hasPowerUp = false) {
    this.counter = 0;
    this.hasPlayer = false;
    this.hasPowerUp = hasPowerUp;
    this.theme = this.generateThemes();
  }

  generateThemes() {
    const numThemes = Math.random() < 0.8 ? 1 : 2;
    const themes = [];

    while (themes.length < numThemes) {
      const randomNum = Math.floor(Math.random() * 6);
      if (!themes.includes(randomNum)) {
        themes.push(randomNum);
      }
    }

    return themes;
  }
}
