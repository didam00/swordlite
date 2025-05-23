import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import Player from './Player';

export default class RedMushroom extends Enemy {
  entityName = 'red_mushroom';
  rotationClockwise = 1;
  lastChargeTime: number = 0;
  chargingTime: number = 2000;
  chargeSpeed: number = 250;
  chargeDuration: number = 750;

  stats = {
    health: 4,
    damage: 1,
    speed: 0,
    scale: 1,
    chargeCoolDown: 1000,
    defense: 0,
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
    this.chargingTime = 4000 / (this.level + 1);
    // this.setVelocityX(10);
  }

  createAnimations(): void {
    const scene = this.scene;

    this.createAnimation('red_mushroom_idle', [0, 5], 12);
    this.createAnimation('red_mushroom_charging', [0, 2], 4, 0);
    this.createAnimation('red_mushroom_charge', [0, 1]); 
  }

  update(delta: number) {
    super.update(delta);
    if (this.hasState('charge')) {
      let speed = this.chargeSpeed;
      const dist = this.getDist(this.scene.player);
      if (dist > 120) {
        this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y) + Math.PI / 2;
      }
      this.vx = Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = Math.sin(this.rotation - Math.PI / 2) * speed;
      
    } else if (this.hasState('charging')) {
      const speed = 30;
      this.vx = -Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = -Math.sin(this.rotation - Math.PI / 2) * speed;
      this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y) + Math.PI / 2;
    } else { // idle
      this.vx = 0;
      this.vy = 0;
      this.rotation += (Math.PI * delta / 25000) * this.rotationClockwise;
      this.isPlayerInSight(this.scene.player)
    }
  }

  isPlayerInSight(player: Player): boolean {
    if (
      this.x > this.scene.cameras.main.width - 80 || 
      this.x < 60 || 
      this.scene.now - this.lastChargeTime < this.stats.chargeCoolDown
    ) {
      return false;
    }

    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y) + Math.PI / 2;
    const angleDiff = Phaser.Math.Angle.Wrap(angle - this.rotation);
    const inSight = Math.abs(angleDiff) < Math.PI / 12;

    if (inSight || this.hasState('charging')) {
      const chargingSound = this.playSound('charging', {
        volume: 0.4,
        loop: true,
        rate: 2,
      })
      this.addState('charging');
      this.delayedCall(this.chargingTime, () => {
        chargingSound?.destroy();

        if (!this.isDestroyed) {
          this.removeState('charging');
          this.addState('charge');

          this.playSound('charge', {
            volume: 0.4,
            detune: 1000,
          });
          
          this.delayedCall(this.chargeDuration, () => {
            if (!this.isDestroyed) {
              this.removeState('charge');
              this.lastChargeTime = this.scene.now;
            }
          });
        }
      });
    }

    return inSight;
  }
}