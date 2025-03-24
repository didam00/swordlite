import Phaser from 'phaser';
import Entity from './Entity';
import GameScene from '../scenes/GameScene';
import itemList from '../items/ItemList';
import { Item } from '../items/Item';

class Player extends Entity {
  entityName = 'player';

  stats = {
    maxHealth: 5,
    health: 5,
    attack: 1,
    defense: 2,
    speed: 80,
    jumpPower: 150,
    range: 20,
    jumpCoolDown: 250,
    immuneTime: 1000,
    criticalChance: 0,
    criticalDamage: 2,
    magnet: 20,
    expGain: 10,
    evade: 0,
    dashCoolDown: 1000,
    dashDistance: 50
  }

  items: {
    [key: string]: number;
  } = {};

  level: number = 1;
  private _exp: number = 0;
  needExp: number = 40;
  evadeEffect: Phaser.GameObjects.Sprite | null = null;
  
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

  heal(amount: number): void {
    this.stats.health += amount;
    this.stats.health = Math.min(this.stats.health, this.stats.maxHealth);
    this.events.emit('healthChanged', this.stats.health);
  }

  takeDamage(amount: number): void {
    if (this.scene.time.now - this.lastDamagedTime < this.stats.immuneTime) {
      return;
    }

    this.blink(this.stats.immuneTime);

    this.lastDamagedTime = this.scene.time.now;
    
    const isEvade = Math.random() < this.stats.evade / 100;
    
    // evade
    if (isEvade) {
      this.evadeEffect = this.scene.add.sprite(this.x, this.y, 'effects', 'evade_shield-0');
      this.scene.getEffectLayer().add(this.evadeEffect);

      if (!this.scene.anims.exists('evade_shield')) {
        this.scene.anims.create({
          key: 'evade_shield',
          frames: this.scene.anims.generateFrameNames('effects', {
            prefix: 'evade_shield-',
            start: 0,
            end: 5
          }),
          frameRate: 24,
          repeat: 0
        });
      }

      // evadeEfffect follow player
      this.evadeEffect.setOrigin(0.5, 0.5);
      this.evadeEffect.setScale(this.scene.player.scale);
      this.evadeEffect.setRotation(Phaser.Math.Between(0, 360));

      this.evadeEffect.play('evade_shield');
      this.evadeEffect.on('animationcomplete', () => {
        this.evadeEffect!.destroy();
      });

      this.scene.playSound('evade', {
        volume: 0.8,
        detune: 1000
      });
    } else {
      this.stats.health -= amount;
      this.events.emit('healthChanged', this.stats.health);

      this.scene.playSound('hurt', {
        volume: 0.8
      })
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

  getRealRange(): number {
    return this.stats.range * 1.125 + 2.5;
  }

  set speed(value: number) {
    this.stats.speed = value;
  }

  get speed(): number {
    return this.stats.speed;
  }

  get exp(): number {
    return this._exp;
  }

  get maxHealth(): number {
    return this.stats.maxHealth;
  }

  set maxHealth(value: number) {
    this.stats.maxHealth = value;
    this.scene.updateHealthUI();
  }

  set exp(value: number) {
    this._exp = value;

    if (this._exp >= this.needExp) {
      this._exp -= this.needExp;
      this.level += 1;
      this.needExp = Math.floor(this.needExp * 1.5);

      // level up event
      this.events.emit('levelUp', this.level);
    }
    this.scene.updateExpBar();
  }

  collectItem(item: Item): void {
    this.items[item.id] = this.items[item.id] ? this.items[item.id] + 1 : 1;
    item.onCollect();

    this.scene.playSound('collectItem', {
      volume: 0.25
    });
  }

  getItem(id: string): number {
    return this.items[id] || 0;
  }
}

export default Player;