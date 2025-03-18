class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  create() {
    this.cameras.main.setBackgroundColor('#ffffff');
  }
}

export default GameScene;