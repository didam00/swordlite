import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';

export default class Bat extends Enemy {
  entityName = 'bat';
  exp = 10;

  stats = {
    health: 10,
    damage: 1,
    speed: 75,
    scale: 1,
    defense: 2,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle", "stop"
    ], scene, x, y);

    this.setSize(12, 8);
    
    this.createAnimations();
    this.updateAnimation();
  }
  
  onSpawn() {
    this.addState("stop");

    if (this.y < this.scene.cameras.main.height / 2) {
      this.y = 7;
    } else {
      this.y = this.scene.cameras.main.height - 7;
      this.scaleY = -1;
    }

    this.stats.speed = this.level * 10 + 65;
  }
  
  createAnimations(): void {
    this.createAnimation('bat_idle', [0, 3], 12);
    this.createAnimation('bat_stop', [0, 1], 4);
  }

  onDamaged(amount: number, isCritical: boolean): void {
    super.onDamaged(amount, isCritical);
    this.removeState("stop");
  }

  update(delta: number) {
    super.update(delta);
    this.vx = 0;
    this.vy = 0;

    // if (this.alpha === 0 && this.getDist(this.scene.player) < this.scene.cameras.main.height / 2 + 100) {
    //   this.scene.tweens.add({
    //     targets: this,
    //     alpha: 1,
    //     duration: 250,
    //   });
    // }
    const dist = this.getDist(this.scene.player)

    if (this.hasState("stop") && dist < this.scene.cameras.main.height / 4 + this.level * 30) {
      this.removeState("stop");
      if (this.scaleY === -1) this.scaleY = 1;
      this.playSound("bat");
    }

    if (!this.hasState("stop")) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
      let speed = this.stats.speed;

      // if (dist < this.scene.player.range + 20) {
      //   speed = this.stats.speed * 0.8;
      // }

      this.velocity = [
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      ];

      if (this.x < this.scene.player.x) {
        this.scaleX = -1;
      } else {
        this.scaleX = 1;
      }
    }
  }
}