import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';

export default class PurpleMushroom extends Enemy {
  entityName = 'purple_mushroom';
  rotationClockwise = 1;
  exp = 20;

  stats = {
    health: 8,
    damage: 1,
    speed: 0,
    scale: 1,
    defense: 2,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle",
    ], scene, x, y);

    this.body!.setSize(16, 16);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationClockwise = Math.random() < 0.5 ? 1 : -1;
    this.setScale(this.stats.scale);

    this.createAnimations();
    this.updateAnimation();
  }

  createAnimations(): void {
    this.createAnimation('purple_mushroom_idle', [0, 1], 6);
  }

  update(delta: number) {
    super.update(delta);
    this.velocity = [0, 0];
    this.rotation += (Math.PI * delta / 20000) * this.rotationClockwise;
  }

  onDead(): void {
    const cnt = 24 * (0.5 + this.level * 0.5);
    for (let i = 0; i < cnt; i++) {
      const speed = 110 * Math.random() * (0.5 + this.level * 0.5) + 60;
      const angle = Math.PI / (cnt / 2) * i;
      
      const bullet = this.createBullet(0x643499, Math.random() * 6 + 3, (Math.random() * 2000 + 500) * this.level, 1, {
        drag: 0.002,
        speed: [
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
        ]
      })!;

      // bullet.update = (time, delta) => {
      //   (bullet as any)._ovx *= 0.97;
      //   (bullet as any)._ovy *= 0.97;
      //   const vx = (bullet as any)._ovx
      //   const vy = (bullet as any)._ovy;
        
      //   bullet.body?.setVelocityX(vx - player.speed);
      //   bullet.body?.setVelocityY(vy - 10);
      // }
    }
  }
}