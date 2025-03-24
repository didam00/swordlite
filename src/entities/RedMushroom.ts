import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import Player from './Player';

export default class RedMushroom extends Enemy {
  entityName = 'red_mushroom';
  rotationClockwise = 1;
  lastChargeTime: number = 0;

  stats = {
    health: 1,
    attack: 1,
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
    // this.setVelocityX(10);
  }

  createAnimations(): void {
    const scene = this.scene;

    this.createAnimation('red_mushroom_idle', [0, 5], 12);
    this.createAnimation('red_mushroom_charging', [0, 2], 4, 0);
    this.createAnimation('red_mushroom_charge', [0, 1]); 
  }

  update(delta: number) {
    if (this.hasState('charge')) {
      let speed = 250;
      const dist = this.getDist(this.scene.player);
      if (dist > 120) {
        this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.scene.getPlayer().x, this.scene.getPlayer().y) + Math.PI / 2;
      }
      this.vx = Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = Math.sin(this.rotation - Math.PI / 2) * speed;
      
    } else if (this.hasState('charging')) {
      const speed = 30;
      this.vx = -Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = -Math.sin(this.rotation - Math.PI / 2) * speed;
      this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.scene.getPlayer().x, this.scene.getPlayer().y) + Math.PI / 2;
    } else { // idle
      this.vx = 0;
      this.vy = 0;
      this.rotation += (Math.PI * delta / 25000) * this.rotationClockwise;
      this.isPlayerInSight(this.scene.getPlayer())
    }
  }

  isPlayerInSight(player: Player): boolean {
    if (
      this.x > this.scene.cameras.main.width - 120 || 
      this.x < 80 || 
      this.scene.time.now - this.lastChargeTime < this.stats.chargeCoolDown
    ) {
      return false;
    }

    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y) + Math.PI / 2;
    const angleDiff = Phaser.Math.Angle.Wrap(angle - this.rotation);
    const inSight = Math.abs(angleDiff) < Math.PI / 12;

    if (inSight) {
      const chargingSound = this.scene.playSound('charging', {
        volume: 0.4,
        loop: true,
        rate: 2,
      })
      this.addState('charging');
      this.scene.time.delayedCall(2000, () => {
        chargingSound?.destroy();

        if (!this.isDestroyed) {
          this.removeState('charging');
          this.addState('charge');

          this.scene.playSound('charge', {
            volume: 0.4,
            detune: 1000,
          });
          
          this.scene.time.delayedCall(750, () => {
            if (!this.isDestroyed) {
              this.removeState('charge');
              this.lastChargeTime = this.scene.time.now;
            }
          });
        }
      });
    }

    return inSight;
  }
}