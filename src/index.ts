import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import PreloadScene from './scenes/PreloadScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 16*20,
  height: 9*20,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    // autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
        gravity: {
          x: 0,
          y: 300,
        },
        debug: true
    }
  },
  backgroundColor: '#000000',
  parent: 'app',
  scene: [PreloadScene, GameScene, BootScene]
}

new Phaser.Game(config)