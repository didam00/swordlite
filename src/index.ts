import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import PreloadScene from './scenes/PreloadScene';

const SCALE = 28;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 16*SCALE,
  height: 9*SCALE,
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
          y: 0,
        },
        debug: false
    }
  },
  render: {
    pixelArt: true,
    roundPixels: true
  },
  backgroundColor: '#000000',
  parent: 'app',
  scene: [PreloadScene, GameScene, BootScene]
}

new Phaser.Game(config)