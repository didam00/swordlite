class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene')
  }

  preload() {
    this.load.atlas('atlas', 'assets/atlas.png', 'assets/atlas.json');
  }

  create() {
    this.scene.start('GameScene');
  }
}

export default PreloadScene;