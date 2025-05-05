import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import MiniStone from './MiniStone';
import Stone from './Stone';

export default class Henge extends Enemy {
  entityName = 'henge';
  exp = 20;
  stoneAngle: number = 0;
  stoneCount: number = 8;
  stoneDist: number = 20;

  stats = {
    health: 8,
    damage: 1,
    speed: 80,
    scale: 1,
    defense: 4,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle"
    ], scene, x, y);

    this.setSize(18, 16);
    
    this.createAnimations();
    this.updateAnimation();
  }

  onSpawn() {
    this.stoneCount = (this.level + 1) * 4;

    for (let i = 0; i < this.stoneCount; i++) {
      const angle = Math.PI * 2 * i / this.stoneCount;
      const stone = this.scene.spawnEnemy(Math.random() < 0.5 * ((this.scene.player.stats.luck - this.level * 10) / 100) ? "mini_stone" : "stone") as Stone | MiniStone;

      if (stone) {
        stone.setPosition(
          this.x + Math.cos(angle) * this.stoneDist,
          this.y + Math.sin(angle) * this.stoneDist
        );

        stone.henge = this;
        stone.index = i;
      }
    }
  }
  
  createAnimations(): void {
    this.createAnimation('henge_idle', [0, 3], 8);
  }

  update(delta: number) {
    super.update(delta);

    this.stoneAngle += 0.001 * delta;

    this.vx = 0;
    this.vy = 0;
  }
}