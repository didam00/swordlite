import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import Player from './Player';

export default class BlueMushroom extends Enemy {
  entityName = 'blue_mushroom';
  rotationClockwise = 1;
  // private bulletTimer: Phaser.Time.TimerEvent | null = null;
  bulletCooldown: number = 0;
  lastShotTime: number = 0;

  stats = {
    health: 7,
    damage: 1,
    speed: 0,
    scale: 1,
    defense: 1,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle",
      "shot",
    ], scene, x, y);

    this.body!.setSize(14, 14);
    this.rotation = Math.PI / 16 + (Math.PI / 16) * Math.random() - Math.PI / 2;
    // this.rotationClockwise = Math.random() < 0.5 ? 1 : -1;
    this.setScale(this.stats.scale);

    this.createAnimations();
    this.updateAnimation();
    // this.setVelocityX(10);

    // const delay = (Math.random() * 1500 + 2500) * 80 / (this.scene.player.speed);
    
    // this.bulletTimer = scene.time.addEvent({
    //   delay: delay,
    //   callback: this.setShotMode,
    //   callbackScope: this,
    //   loop: true
    // });

    // this.playerSpeedUpdated(0);
    this.delayedCall(250 + 2000 * Math.random(), () => {
      this.bulletCooldown = 6000 / (this.level + 1);
    })
  }

  createAnimations(): void {
    const scene = this.scene;

    this.createAnimation('blue_mushroom_idle', [0, 3], 8);
    this.createAnimation('blue_mushroom_shot', [0, 3], 3, 0); 
  }

  // playerSpeedUpdated(diff: number): void {
  //   // this.bulletCooldown = (Math.random() * 1500 + 2500) * 80 / (this.scene.player.speed);
  //   this.bulletCooldown = Math.random() * 1500 + 2500;
  // }

  update(delta: number) {
    super.update(delta);
    if (this.hasState('shot')) {
      const speed = -20;
      this.vx = Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = Math.sin(this.rotation - Math.PI / 2) * speed;
    } else {
      this.vx = 0;
      this.vy = 0;

      const player = this.scene.player;
      const targetAngle = Phaser.Math.Angle.Between(
        this.x, this.y,
        player.x, player.y
      ) + Math.PI / 2;
      
      let angleDiff = Phaser.Math.Angle.Wrap(targetAngle - this.rotation);
      const rotationAmount = 0.005 * delta / 16;
      const rotation = Math.abs(angleDiff) > rotationAmount 
      ? Math.sign(angleDiff) * rotationAmount 
      : angleDiff;

      this.rotation = Phaser.Math.Angle.Wrap(this.rotation + rotation);

      if (this.x >= 100 && this.scene.now - this.lastShotTime >= this.bulletCooldown && this.bulletCooldown != 0) {
        this.setShotMode();
        this.lastShotTime = this.scene.now;
      }
    }
    
    // 상태가 변경되면 애니메이션 업데이트
    this.updateAnimation();
  }

  setShotMode(): void {
    const charingSound = this.playSound('shotCharging', {
      volume: 0.4,
      loop: true,
      detune: 500,
      rate: 1.5,
    })
    
    this.addState('shot');
    this.delayedCall(333 * 3, () => {
      charingSound?.destroy();
      if (this.isDestroyed) return;

      this.playSound('rocket', {
        volume: 1,
        detune: -500,
      })

      for (let i = 0; i < 24; i++) {
        this.shotToPlayer(
          this.rotation - Math.PI / 32 + Math.PI / 16 * Math.random(),
          Math.random() * 4 + 2,
          Math.random() * 240 + 160,
          Math.random() * 560 + 400
        );
      }
    });
    this.delayedCall(1000, () => {
      if (this.isDestroyed) return;

      this.removeState('shot');
    });
  }
  
  /**
   * 플레이어를 향해 총알을 발사하는 메서드
   */
  shotToPlayer(toRotate: number, size: number, speed: number, life: number): void {
    if (this.health <= 0 || !this.active) {
      return;
    }
    
    const bullet = this.createBullet(0x6b74b2, size, life, 1, {
      speed: [
        Math.cos(toRotate - Math.PI / 2) * speed,
        Math.sin(toRotate - Math.PI / 2) * speed
      ],
      drag: 0.01,
    });
    // bullet?.body.setVelocity(
    //   Math.cos(toRotate - Math.PI / 2) * speed,
    //   Math.sin(toRotate - Math.PI / 2) * speed
    // );

    bullet?.body.setGravityY(20);
  }
  
  // destroy(fromScene?: boolean): void {
  //   super.destroy(fromScene);
  // }
}