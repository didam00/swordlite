import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';

export default class Torch extends Enemy {
  entityName = 'torch';
  exp = 10;
  lastChargeTime: number = 0;
  chargeCoolTime: number = 2000;
  emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

  stats = {
    health: 5,
    damage: 1,
    speed: 20,
    scale: 1,
    defense: 1,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle",
      "charge"
    ], scene, x, y);

    this.setSize(20, 8);
    
    this.createAnimations();
    this.updateAnimation();
  }

  onSpawn() {
    this.chargeCoolTime = (this.level + 1) * 1000
  }

  createAnimations(): void {
    this.createAnimation('torch_idle', [0, 3], 8);
    this.createAnimation('torch_charge', [0, 3], 12, 0);
  }

  update(delta: number) {
    super.update(delta);

    if (
      Math.abs(this.y - this.scene.player.y) < 4 &&
      this.lastChargeTime + this.chargeCoolTime < this.scene.now &&
      this.x < this.scene.cameras.main.width - 40 &&
      this.x > this.scene.player.x &&
      !this.hasState("charge")
    ) {
      this.addState("charge");

      this.delayedCall(1000 / 4, () => {
        if (!this) return;

        const speed = 40 * (this.level + 2);
        const angle = Math.PI / 64 - Math.PI / 32 * Math.random();

        const emitter = this.scene.add.particles(0, 0, "circle-particle", {
          frequency: 20,
          lifespan: {min: 100, max: 200},
          scale: {start: 1 / 4, end: 0},
          speedY: {min: 15, max: -15},
          color: [0xffe091, 0xff965f, 0xff6866],
        });

        const bullet = this.createBullet(0xffe091, 3, 5000, 1, {
          speed: [- Math.cos(angle) * speed, - Math.sin(angle) * speed],
          strokeWidth: 2, 
          strokeColor: 0xff965f,
          emitter,
          x: this.x - 8,
        });
        bullet?.body.setCircle(5);

        emitter.follow = bullet;
        this.emitters.push(emitter);
        this.scene.layers.effect.add(emitter);

        this.playSound("fire");
      });

  
      this.delayedCall(1000 / 3, () => {
        if (!this) return;

        this.removeState("charge");
      });

      this.lastChargeTime = this.scene.now;
    }

    this.vx = -this.stats.speed;
  }

  remove() {
    super.remove();

    this.scene.time.delayedCall(5000, () => {
      this.emitters.forEach((emitter) => {
        if (!emitter.follow) {
          emitter.destroy();
        }
      });
    })
  }
}