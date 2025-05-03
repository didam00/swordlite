import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import $s from '../utils/randomSIgn';

// 그냥 피해 입을 때마다 먹물 뿌리는 걸로 하자. 죽으면 개 크게 뿌리고
export default class Squid extends Enemy {
  entityName = 'squid';
  exp = 25;
  clockwise: boolean = false;
  stepSize: number = 0.1;
  emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

  stats = {
    health: 16,
    damage: 1,
    speed: 20,
    scale: 1,
    defense: 4,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle", "charge"
    ], scene, x, y);

    const angle = Phaser.Math.Angle.Between(x, y, scene.player.x, scene.player.y);
    this.rotation = angle + Math.PI / 2;
    this.clockwise = Math.random() < 0.5;
    this.stepSize = Math.random() * 0.15 + 0.05;
    this.setSize(18, 18);

    this.createAnimations();
    this.updateAnimation();

    const spreadSpeed = [10, 30] as [number, number];
    const playerSpeed = this.scene.player.speed;
  }
  
  createAnimations(): void {
    this.createAnimation('squid_idle', [0, 7], 16);
    // this.createAnimation('squid_charge', 'squid_idle', [0, 7], 16);
  }
  
  update(delta: number) {
    super.update(delta);

    this.rotation += (this.clockwise ? this.stepSize : -this.stepSize) * delta / 1000;

    const angle = this.rotation - Math.PI / 2;
    this.velocity = [
      Math.cos(angle) * this.stats.speed,
      Math.sin(angle) * this.stats.speed,
    ];

    if (this.stats.speed > 20) {
      this.stats.speed -= 60 * delta / 1000;
    }
  }
  
  onDamaged(damage: number, isCritical: boolean): void {
    super.onDamaged(damage, isCritical);
    const player = this.scene.player;
    const angle = this.rotation - Math.PI / 2;

    this.stats.speed = 180;
    const randomAngle = Math.random() * Math.PI / 4 * (this.y < this.scene.cameras.main.height / 2 ? 1 : -1);
    this.rotation = Math.PI / 2 + randomAngle;

    const emitter = this.scene.add.particles(0, 0, 'circle-particle', {
      lifespan: { min: 1200, max: 2400 },
      speed: { min: 2, max: 12 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.15, end: 0.75 },
      tint: 0x12173d,
      duration: 2000,
      frequency: 20,
      quantity: 4,
      emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
        particle.velocityX = particle.velocityX - player.speed + 50;
      },
      follow: this,
      followOffset: {
        x: - Math.cos(this.rotation - Math.PI / 2) * 10,
        y: - Math.sin(this.rotation - Math.PI / 2) * 10,
      }
    })

    this.emitters.push(emitter);
    this.scene.layers.top.add(emitter);

    this.scene.time.delayedCall(4400, () => {
      emitter.stop()
      emitter.destroy();
    })

    this.playSound('splash', {
      volume: 1.2,
      detune: -300,
    })
  }

  dead(): void {

  }

  remove(): void {
    this.emitters.forEach(emitter => {
      emitter.stop();
    })
    super.remove();
  }
}