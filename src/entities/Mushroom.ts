import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';

export default class Mushroom extends Enemy {
  entityName = 'mushroom';
  rotationClockwise = 1;

  stats = {
    health: 2,
    attack: 1,
    speed: 0,
    chargeCoolDown: 1000,
    // scale: Math.random() * 0.4 + 1.2,
    scale: 1,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle",
      "charging",
      "charge",
    ], scene, x, y);

    this.body!.setSize(10, 10);
    this.rotation = Math.random() * Math.PI * 2;
    this.setScale(this.stats.scale);

    this.createAnimations();
    this.updateAnimation();
  }

  createAnimations(): void {
    const scene = this.scene;

    this.createAnimation('mushroom_idle', [0, 5], 12);
    this.createAnimation('mushroom_charging', [0, 2], 4, 1);
    this.createAnimation('mushroom_charge', [0, 1]);
  }

  update(delta: number) {
    if (Math.random() < 0.0002 * delta) {
      this.rotationClockwise = -this.rotationClockwise;
    }

    this.rotation += (Math.PI / 20 * delta / 1000) * this.rotationClockwise;

    const speed = 10;
  
    const vx = Math.cos(this.rotation - Math.PI / 2) * speed * (delta / 1000);
    const vy = Math.sin(this.rotation - Math.PI / 2) * speed * (delta / 1000);

    this.vx = vx * (1000 / delta)
    this.vy = vy * (1000 / delta);
  }
}