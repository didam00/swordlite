import Phaser from 'phaser';
import Entity from './Entity';

class Player extends Entity {
  entityName = 'player';

  stats = {
    health: 4,
    attack: 1,
    defense: 2,
    speed: 20,
    jumpPower: 150,
    range: 20,
    jumpCoolDown: 250,
  }
  
  private lastJumpTime: number = 0;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super([
      "idle", "jump", "fall"
    ], scene, x, y);

    this.body!.setSize(6, 9);
    this.setGravityY(0);
    
    this.createAnimations();
    this.updateAnimation();
  }

  createAnimations(): void {
    const scene = this.scene;
    
    this.createAnimation('player_idle');
    this.createAnimation('player_jump');
    this.createAnimation('player_fall', [0, 3], 24, -1);
  }
  
  jump(): void {
    const currentTime = this.scene.time.now;
    
    if (currentTime - this.lastJumpTime < this.stats.jumpCoolDown) {
      return;
    }
    
    this.lastJumpTime = currentTime;
    
    this.setVelocityY(-this.stats.jumpPower);
    
    this.removeState('fall');
    this.addState('jump');
    
    this.events.emit('jump', {
      x: this.x,
      y: this.y - 4,
      isPlayerJumping: true
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

  set speed(value: number) {
    this.stats.speed = value;
  }

  get speed(): number {
    return this.stats.speed;
  }
}

export default Player;