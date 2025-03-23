import Phaser from 'phaser';
import Entity from './Entity';
import GameScene from '../scenes/GameScene';

class Player extends Entity {
  entityName = 'player';

  stats = {
    maxHealth: 5,
    health: 5,
    attack: 1,
    defense: 2,
    speed: 45,
    jumpPower: 150,
    range: 20,
    jumpCoolDown: 250,
    immuneTime: 1000,
  }
  
  private lastJumpTime: number = 0;
  private lastDamagedTime: number = 0;
  
  constructor(scene: GameScene, x: number, y: number) {
    super([
       "stun", "attack", "idle", "jump", "fall"
    ], scene, x, y);

    this.body!.setSize(6, 9);
    this.setGravityY(300);
    
    this.createAnimations();
    this.updateAnimation();
  }

  createAnimations(): void {
    const scene = this.scene;
    
    this.createAnimation('player_idle');
    this.createAnimation('player_jump');
    this.createAnimation('player_fall', [0, 3], 24, -1);
  }
  
  jump(power?: number): void {
    const currentTime = this.scene.time.now;
    power = power || this.stats.jumpPower;
    
    if (currentTime - this.lastJumpTime < this.stats.jumpCoolDown) {
      return;
    }
    
    this.lastJumpTime = currentTime;
    
    this.setVelocityY(-power);
    
    this.removeState('fall');
    this.addState('jump');
    
    this.events.emit('jump', {
      x: this.x,
      y: this.y - 4,
      isPlayerJumping: true
    });

    this.scene.playSound('jump', {
      volume: 0.8
    });
  }

  onJump(callback: Function, context?: any): this {
    this.events.on('jump', callback, context);
    return this;
  }
  
  update(delta: number): void {
    // 상태 업데이트
    if ((this.body as Phaser.Physics.Arcade.Body).velocity.y < 0) {
      this.removeState("fall");
      this.addState("jump");
    } else if ((this.body as Phaser.Physics.Arcade.Body).velocity.y > 0) {
      this.removeState("jump");
      this.addState("fall");
    } else if ((this.body as Phaser.Physics.Arcade.Body).blocked.down) {
      this.removeState("jump");
      this.removeState("fall");
      this.addState("idle");
    }
  }

  takeDamage(amount: number): void {
    if (this.scene.time.now - this.lastDamagedTime < this.stats.immuneTime) {
      return;
    }

    this.stats.health -= amount;
    console.log('Player health:', this.stats.health);

    this.events.emit('healthChanged', this.stats.health);
    this.blink(this.stats.immuneTime);

    this.lastDamagedTime = this.scene.time.now;
    this.scene.playSound('hurt', {
      volume: 0.8
    })
  }

  set jumpCoolDown(value: number) {
    this.stats.jumpCoolDown = value;
  }

  get jumpCoolDown(): number {
    return this.stats.jumpCoolDown;
  }

  set jumpPower(value: number) {
    this.stats.jumpPower = value;
  }

  get jumpPower(): number {
    return this.stats.jumpPower;
  }

  set range(value: number) {
    this.stats.range = value;
  }

  get range(): number {
    return this.stats.range;
  }

  getRealRange(): number {
    return this.stats.range * 1.125 + 2.5;
  }

  set speed(value: number) {
    this.stats.speed = value;
  }

  get speed(): number {
    return this.stats.speed;
  }
}

export default Player;