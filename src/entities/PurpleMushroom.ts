import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';

export default class PurpleMushroom extends Enemy {
  entityName = 'purple_mushroom';
  rotationClockwise = 1;

  stats = {
    health: 15,
    attack: 1,
    speed: 0,
    scale: 1,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle",
    ], scene, x, y);

    this.body!.setSize(12, 12);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationClockwise = Math.random() < 0.5 ? 1 : -1;
    this.setScale(this.stats.scale);

    this.createAnimations();
    this.updateAnimation();
  }

  createAnimations(): void {
    this.createAnimation('purple_mushroom_idle', [0, 1], 12);
  }

  update(delta: number) {
    this.velocity = {x: 0, y: 0};
    this.rotation += (Math.PI * delta / 5000) * this.rotationClockwise;
  }

  dead(): void {
    const cnt = 50;
    for (let i = 0; i < cnt; i++) {
      const bullet = this.createBullet(0x643499, Math.random() * 5 + 2, Math.random() * 2000 + 500)!;
      const speed = 120 * Math.random() + 80;
      bullet.rotation = Math.PI / (cnt / 2) * i;
      
      (bullet as any)._ovx = Math.cos(bullet.rotation) * speed;
      (bullet as any)._ovy = Math.sin(bullet.rotation) * speed;

      const player = this.scene.player;
      
      bullet.update = (time, delta) => {
        (bullet as any)._ovx *= 0.97;
        (bullet as any)._ovy *= 0.97;
        const vx = (bullet as any)._ovx
        const vy = (bullet as any)._ovy;
        
        bullet.body?.setVelocityX(vx - player.speed);
        bullet.body?.setVelocityY(vy - 10);
      }

      bullet.body.setDamping(true);
      bullet.body.setDrag(0.025);
    }
  }
}