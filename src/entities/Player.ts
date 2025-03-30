import Phaser from 'phaser';
import Entity from './Entity';
import GameScene from '../scenes/GameScene';
import itemList from '../items/ItemList';
import { createItem, Item } from '../items/Item';

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
    expGain: 100,
    evade: 0,
    evadeCoolDown: 11000,
    dashCoolDown: 4000,
    dashDistance: 0,
    lightAttackSize: 0,
    collisionDamage: 0,
  }

  items: {
    [key: string]: number;
  } = {};

  level: number = 1;
  private _exp: number = 0;
  needExp: number = 40;
  followEffects: Phaser.GameObjects.Sprite[] = [];
  private _o__gravity: number = 300;
  private _gravity: number = 1;
  
  private lastJumpTime: number = 0;
  private lastDamagedTime: number = 0;
  private lastDashTime: number = 0;
  readonly isFollowCamera: boolean = true;
  private lastEvadeTime: number = 0;
  
  constructor(scene: GameScene, x: number, y: number) {
    super([
       "dash", "stun", "attack", "idle", "jump", "fall"
    ], scene, x, y);

    this.body!.setSize(6, 9);
    this.setGravityY(this._o__gravity);
    
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

    if (this.hasItem("light_rod")) {
      this.lightAttack();
    }

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

  takeDamage(amount: number, type: "enemy" | "wall" = "enemy"): void {
    if (amount <= 0) return;

    if (this.scene.time.now - this.lastDamagedTime < this.stats.immuneTime) {
      return;
    }
    
    let isSugarCube = false;
    const SUGAR_CUBE_TIME = 150;

    if (
      this.hasItem("sugar_cube")
      && this.scene.time.now - this.lastEvadeTime > this.stats.evadeCoolDown
      && type != "wall"
    ) {
      isSugarCube = true;
      this.lastEvadeTime = this.scene.time.now;
    }

    this.blink(isSugarCube ? SUGAR_CUBE_TIME : this.stats.immuneTime);
    this.lastDamagedTime = isSugarCube ? (this.scene.time.now - this.stats.immuneTime + SUGAR_CUBE_TIME) : this.scene.time.now;
    
    const isEvade = isSugarCube || (Math.random() < this.stats.evade / 100);
    
    // evade
    if (isEvade) {
      const evadeEffect = this.scene.add.sprite(this.x, this.y, 'effects', 'evade_shield-0');
      this.followEffects.push(evadeEffect);
      this.scene.getEffectLayer().add(evadeEffect);

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
      evadeEffect.setOrigin(0.5, 0.5);
      evadeEffect.setScale(this.scene.player.scale);
      evadeEffect.setRotation(Phaser.Math.Between(0, 360));

      evadeEffect.play('evade_shield');
      evadeEffect.on('animationcomplete', () => {
        evadeEffect!.destroy();
        this.followEffects = this.followEffects.filter(e => e !== evadeEffect);
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

  dash(): void {
    // if (!this.checkItem('shadow_water')) return;
    const now = this.scene.time.now;

    if (now - this.lastDashTime < this.stats.dashCoolDown) {
      return;
    }

    this.lastDashTime = now;

    this.scene.playSound('dash', {
      volume: 0.8,
      detune: 1000
    });
    
    this.addState('stun');
    this.addState('dash');

    const dashSpeed = 100;
    const dashDistance = this.stats.dashDistance * this.speed / 80;

    this.speed += dashDistance * Math.floor(1000 / dashSpeed);
    const prevGravity = this.gravity;
    this.gravity = 0;

    // 플레이어의 현재 위치에 잔상을 남김
    const trail = this.scene.add.sprite(this.x, this.y, 'atlas', `player_${this.getHightestPriorityState()}-0`);
    // trail.setAlpha(0.5);

    trail.setScale(this.scale);
    trail.setOrigin(0.5, 0.5);
    
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      x: this.x - dashDistance,
      duration: dashSpeed,
      onComplete: () => {
        trail.destroy();
      }
    });
    
    this.scene.time.delayedCall(dashSpeed, () => {
      this.removeState('stun');
      this.removeState('dash');
      this.speed -= dashDistance * Math.floor(1000 / dashSpeed);
      this.gravity = prevGravity;
    });
    
    this.lastDamagedTime = now - this.stats.immuneTime + dashSpeed;
    this.blink(dashSpeed);
  }

  lightAttack(): void {
    const scene = this.scene;

    // 플레이어 방향으로 빛을 발사
    if (!scene.anims.exists("light_attack")) {
      scene.anims.create({
        key: "light_attack",
        frames: scene.anims.generateFrameNames('effects', {
          prefix: "light_attack-", start: 0, end: 2
        }),
        frameRate: 24,
        repeat: -1
      });
    }

    // 빛 공격을 발사
    const light_attack = scene.add.sprite(
      scene.player.x, scene.player.y - 8, 'effects', 'light_attack-0'
    ).play('light_attack');
    scene.physics.add.existing(light_attack);
    light_attack.setOrigin(0.5, 0.5);

    const body = light_attack.body as Phaser.Physics.Arcade.Body;
    light_attack.setScale(1, scene.player.range / 120 * (this.stats.lightAttackSize / 100));
    body.setSize(32, 64);
    body.setVelocityX(600 - scene.player.stats.speed);

    // 엔티티와 충돌하면 사라지고 플레이어 공격력만큼 데미지
    scene.physics.add.collider(light_attack, scene.enemyGroup, (light, enemy) => {
      (enemy as any).takeDamage(scene.player.stats.attack);
      light.destroy();
    });

    scene.getEffectLayer().add(light_attack);
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
    const prevSpeed = this.stats.speed;
    this.stats.speed = value;
    this.events.emit("speedChanged", value - prevSpeed);
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
    const diff = value - this._exp;
    this._exp += diff * (this.stats.expGain / 100);

    while (this._exp >= this.needExp) {
      this._exp -= this.needExp;
      this.level += 1;
      this.needExp = this.needExp + 20;

      // level up event
      this.events.emit('levelUp', this.level);
    }
    this.scene.updateExpBar();
  }

  get evadeCoolDown(): number {
    return this.stats.evadeCoolDown;
  }

  set evadeCoolDown(value: number) {
    this.stats.evadeCoolDown = value > 1000 ? value : 1000;
  }

  collectItem(item: Item | string): void {
    if (typeof item === 'string') {
      item = createItem(item, 0, 0, this.scene)!;
    }

    this.items[item.id] = this.items[item.id] ? this.items[item.id] + 1 : 1;
    item.onCollect();

    this.scene.playSound('collectItem', {
      volume: 0.25
    });
  }

  hasItem(id: string): number {
    return this.items[id] || 0;
  }

  get gravity(): number { 
    return this._gravity;
  }

  set gravity(value: number) {
    this._gravity = value;
    this.setGravityY(this._o__gravity * value);
  }

  createBullet(color: number = 0x00ffff, size: number = 3, life: number = 5000, damage?: number, shadowConfig?: ShadowConfig): Phaser.GameObjects.Arc & {
    body: Phaser.Physics.Arcade.Body
  } | null {
    const scene = this.scene as GameScene;
    const player = scene.getPlayer();
    if (!scene || !scene.getBulletGroup) return null;

    if (damage === null || damage === undefined) {
      damage = this.stats.attack;
    }
    
    const bullet = scene.add.circle(this.x, this.y, size, color) as unknown as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(bullet);
    bullet.body.setCircle(size);
    
    if (scene.getBulletGroup()) {
      scene.getBulletGroup().add(bullet);
    }
    
    scene.getEffectLayer().add(bullet);
    scene.physics.add.overlap(bullet, scene.enemyGroup, (bullet: any, enemy: any) => {
      console.log("bullet hit enemy", bullet, enemy);
      enemy.takeDamage(damage);
      bullet.destroy();
    });

    // 잔상이 남음. shadowLife 이후에 destroy됨. alpha만큼 점점 투명해짐
    if (shadowConfig != undefined) {
      shadowConfig = {
        display: true,
        life: 500,
        alpha: 0.5,
        interval: 100,
        ...shadowConfig
      };

      const createShadow = (x: number, y: number) => {
        const shadow = scene.add.circle(x, y, size, color);
        scene.tweens.add({
          targets: shadow,
          alpha: shadowConfig!.alpha,
          duration: shadowConfig!.life!,
          onComplete: () => {
            if (shadow && shadow.active) {
              console.log("check");
              shadow.destroy()
            };
          }
        });
      }

      scene.time.addEvent({
        delay: shadowConfig.interval,
        repeat: -1,
        callback: () => {
          createShadow(bullet.x, bullet.y);
        },
        callbackScope: this
      })
    }
    
    if (life > 0) {
      scene.time.delayedCall(life, () => {
        if (bullet && bullet.active) {
          bullet.destroy();
        }
      });
    }

    return bullet;
  }
}

interface ShadowConfig {
  display?: boolean;
  life?: number;
  alpha?: number;
  interval?: number;
}

export default Player;