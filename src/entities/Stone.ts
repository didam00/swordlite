import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import Henge from './Henge';

export default class Stone extends Enemy {
  entityName = 'stone';
  exp = 2;
  index: number = 0;
  henge: Henge | null = null;

  stats = {
    health: 7,
    damage: 1,
    speed: 20,
    scale: 1,
    defense: 3,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle"
    ], scene, x, y);

    this.setSize(10, 8);
    
    this.createAnimations();
    this.updateAnimation();
  }
  
  createAnimations(): void {
    this.createAnimation('stone_idle');
  }

  update(delta: number) {
    super.update(delta);
    
    if (this.henge && !this.henge.isDead) {
      const angle = this.henge.stoneAngle + Math.PI * 2 / this.henge.stoneCount * this.index;

      this.setPosition(
        this.henge.x + Math.cos(angle) * this.henge.stoneDist,
        this.henge.y + Math.sin(angle) * this.henge.stoneDist
      );
    }

    this.vx = 0;
    this.vy = 0;
  }
}