import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import Player from './Player';

export default class FakeRedMushroom extends Enemy {
  entityName = 'fake_red_mushroom';
  rotationClockwise = 1;
  chargingTime: number = 500;
  chargeSpeed: number = 350;
  chargeDuration: number = 1000;
  exp: number = 0;
  untargetability: boolean = true;

  stats = {
    health: 1,
    attack: 0,
    speed: 0,
    scale: 1,
    chargeCoolDown: 1000,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle",
      "charging",
      "charge",
    ], scene, x, y);

    this.body!.setSize(10, 10);
    this.rotation = Math.random() * Math.PI / 2 + Math.PI * 3 / 2 - Math.PI / 4;
    this.rotationClockwise = Math.random() < 0.5 ? 1 : -1;
    this.setScale(this.stats.scale);

    this.createAnimations();
    this.updateAnimation();
  }

  createAnimations(): void {
    const scene = this.scene;

    this.createAnimation('fake_red_mushroom_idle', 'red_mushroom_idle', [0, 5], 12);
    this.createAnimation('fake_red_mushroom_charging', 'red_mushroom_charging', [0, 2], 4, 0);
    this.createAnimation('fake_red_mushroom_charge', 'red_mushroom_charge', [0, 1]); 
  }

  update(delta: number) {
    if (this.hasState('charge')) {
      let speed = this.chargeSpeed;
      // const dist = this.getDist(this.scene.player);

      if (this.x < 200) {
        this.scene.tweens.add({
          targets: this,
          alpha: 0.05,
          duration: 100,
        });
      }

      this.vx = Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = Math.sin(this.rotation - Math.PI / 2) * speed;
      
    } else if (this.hasState('charging')) {
      const speed = 30;
      this.vx = -Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = -Math.sin(this.rotation - Math.PI / 2) * speed;
    }
  }

  isPlayerInSight(player: Player): void {
    const chargingSound = this.scene.playSound('charging', {
      volume: 0.2,
      loop: true,
      rate: 2,
    })
    this.addState('charging');
    this.scene.time.delayedCall(this.chargingTime, () => {
      chargingSound?.destroy();

      if (!this.isDestroyed) {
        this.removeState('charging');
        this.addState('charge');

        this.scene.playSound('charge', {
          volume: 0.2,
          detune: 1000,
        });
        
        this.scene.time.delayedCall(this.chargeDuration, () => {
          if (!this.isDestroyed) {
            this.removeState('charge');
          }
        });
      }
    });
  }
}