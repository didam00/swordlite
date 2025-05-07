import Phaser from 'phaser';
import Entity from './Entity';
import GameScene from '../scenes/GameScene';
import { createItem, CursedItem, Item, MagicCrystal as MagicCrystal } from '../items/Item';
import Sword from '../weapons/Sword';
import Weapon from '../weapons/Weapon';
import Enemy, { SpriteBullet } from './Enemy';
import CopperSword from '../weapons/CopperSword';
import Pickaxe from '../weapons/Pickaxe';
import { Magic } from '../types';
import Boomerang from '../weapons/Boomerang';
import Mace from '../weapons/Mace';

class Player extends Entity {
  entityName = 'player';

  stats = {
    maxHealth: 5,
    health: 5,
    damage: 10,
    trueAttack: 0,
    magicDamage: 0,
    defense: 2,
    mana: 0,
    speed: 60,
    jumpPower: 150,
    range: 15,
    jumpCoolDown: 250,
    attackCoolDown: 250,
    immuneTime: 1000,
    criticalChance: 0,
    criticalDamage: 1.5,
    magnet: 20,
    expGain: 100,
    evade: 0,
    evadeCoolDown: 11000,
    dashCoolDown: 5000,
    dashDistance: 40,
    windyAttackSize: 0,
    collisionDamage: 0,
    coolDown: 100,
    glideTime: 0,
    luck: 100,
    debuffTime: 100, /** 디버프 부여시 지속 시간 */
  }

  items: {
    [key: string]: number;
  } = {};

  curse: number = 0;
  level: number = 1;
  private _exp: number = 0;
  needExp: number = 120;
  followEffects: Phaser.GameObjects.Sprite[] = [];
  private _o__gravity: number = 300;
  private _gravity: number = 1;
  
  private lastJumpTime: number = 0;
  lastDamagedTime: number = 0;
  private lastDashTime: number = 0;
  readonly isFollowCamera: boolean = true;
  private lastEvadeTime: number = 0;
  private magics: Magic[] = [];
  readonly weapons: Weapon[] = [];

  isGodMode: boolean = false;

  itemNameText: Phaser.GameObjects.BitmapText | null = null;
  itemDescText: Phaser.GameObjects.BitmapText | null = null;
  lastNinjaBananaActive: number = 0;
  
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
    const currentTime = this.scene.now;
    power = power || this.stats.jumpPower;
    
    this.events.emit('jump', {
      x: this.x,
      y: this.y - 4,
      isPlayerJumping: true
    });
    
    if (currentTime - this.lastJumpTime < this.stats.jumpCoolDown) {
      return;
    }
    
    this.lastJumpTime = currentTime;
    
    this.setVelocityY(-power);
    
    this.removeState('fall');
    this.addState('jump');
    

    if (this.hasItem("ninja_banana")) {
      this.lastNinjaBananaActive = this.scene.now;
      const particles = this.scene.add.particles(0, 0, 'rect-particle', {
        x: 0,
        y: 0,
        follow: this,
        lifespan: { min: 200, max: 500 },
        speed: { min: 10, max: 30 },
        scale: { start: 4, end: 0 },
        alpha: 1,
        quantity: 16,
        frequency: 50,
        tint: [0x000000],
        duration: 250,
        followOffset: { x: -2, y: -12 },
      });
      this.scene.layers.bottom.add(particles);
      this.setTint(0x000000);
      this.delayedCall(200, () => {
        this.clearTint();
      })
      this.delayedCall(750, () => {
        particles.destroy();
      })
    }

    this.createJumpEffect();
  }

  createJumpEffect(): void {
    const jumpEffect = this.scene.add.sprite(this.x, this.y + 4, 'effects', 'jump-0');
    this.scene.layers.effect.add(jumpEffect);

    if (this.scene.layers.particle) {
      this.scene.layers.particle.add(jumpEffect);
    }

    jumpEffect.play('jump');
    jumpEffect.on('animationcomplete', () => {
      jumpEffect.destroy();
    });

    this.playSound('jump', {
      volume: 0.8
    });
  }

  createBoomerang(angleAlpha: number = 0, customSpeed: number = 0): void {
    const boomerang = this.scene.add.sprite(this.x, this.y, 'effects', 'boomerang-0');
    (boomerang as any).isBoomerang = true;
    this.scene.physics.add.existing(boomerang);
    const body = boomerang.body as Phaser.Physics.Arcade.Body;

    body.setSize(32, 32);
    boomerang.setScale(this.range / 35 - 0.1);
    
    const pointer = this.scene.input.activePointer;
    let targetAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    let boomerangSpeed = customSpeed || dist * 1.5;
    boomerangSpeed *= 1 + (1 - this.stats.coolDown / 100) * 3;
    targetAngle += angleAlpha;
    let isTurn = false;

    let boomerangHits: Enemy[] = [];

    const update = (time: number, delta: number) => {
      if (isTurn) {
        targetAngle = Phaser.Math.Angle.Between(this.x, this.y, boomerang.x, boomerang.y);
        
        if (Phaser.Math.Distance.Between(this.x, this.y, boomerang.x, boomerang.y) < this.body!.width * 2) {
          boomerang.destroy();
          this.scene.events.off('update', update);
          return;
        }
      }

      if (boomerangSpeed < 0 && !isTurn) {
        boomerangHits = [];
        isTurn = true;
      }

      const times = (1 + (1 - this.stats.coolDown / 100) * 3) ** 2;
      boomerangSpeed -= delta * 0.25 * times;
      boomerang.rotation += boomerangSpeed * 0.00025 * times * delta;

      body.setVelocity(
        Math.cos(targetAngle) * boomerangSpeed - this.speed,
        Math.sin(targetAngle) * boomerangSpeed
      );

      this.scene.physics.world.overlap(boomerang, this.scene.enemyGroup, (boomerang, enemy) => {
        if (enemy instanceof Enemy && !boomerangHits.includes(enemy)) {
          enemy.takeDamage(this.stats.damage, false, ["attack"]);
          boomerangHits.push(enemy);
        }
      });
    }

    this.scene.events.on('update', update);
    
    this.scene.layers.effect.add(boomerang);
  }

  onJump(callback: Function, context?: any): this {
    this.events.on('jump', callback, context);

    return this;
  }
  
  update(delta: number): void {
    if (this.isDead) return;

    for (const magic of this.magics) {
      if (magic.cooldown > 0) {
        magic.cooldown -= delta;
      } else {
        magic.cooldown = magic.cooltime * this.stats.coolDown / 100;
        magic.effect?.(this.scene, magic.level);
      }
    }

    // 상태 업데이트
    this.updateState();
  }
  
  updateState(): void {
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

    const now = this.scene.now;
    const ninjaBanana = this.hasItem("ninja_banana");
    if (ninjaBanana && now - this.lastNinjaBananaActive < 200 && type != "wall") {
      let prevEnemy: Phaser.GameObjects.Sprite = this;
      this.setVisible(false);

      this.scene.time.addEvent({
        delay: 25,
        repeat: ninjaBanana - 1,
        callback: () => {
          // 플레이어와 가장 가까운 적에게 데미지
          const enemies = this.scene.enemyGroup.getChildren().filter(e => !(e as Enemy).isDead) as Phaser.Physics.Arcade.Sprite[];
          if (enemies.length === 0) return;
          const closestEnemy = enemies.reduce((prev, curr) => {
            return Phaser.Math.Distance.Between(this.x, this.y, prev.x, prev.y) < Phaser.Math.Distance.Between(this.x, this.y, curr.x, curr.y) ? prev : curr;
          }) as Enemy;
          if (closestEnemy) {
            closestEnemy.takeDamage((this.stats.trueAttack + this.stats.damage) * this.stats.criticalDamage, true, ["attack"]);
            this.playSound('hit', {
              volume: 0.8
            });
            
            // banana ninja 이펙트
            const bananaNinjaEffect = this.scene.add.sprite(
              closestEnemy.x,
              closestEnemy.y,
              'effects',
              'ninja_banana-0'
            ).play('ninja_banana');
            bananaNinjaEffect.setOrigin(0.5, 0.5);
            
            const angle = Phaser.Math.Angle.Between(prevEnemy.x, prevEnemy.y, closestEnemy.x, closestEnemy.y);
            bananaNinjaEffect.setRotation(angle);

            prevEnemy = closestEnemy;
            this.scene.cameras.main.shake(50, 0.01);

            this.scene.time.delayedCall(250, () => {
              bananaNinjaEffect.destroy();
            })
          }
        },
      })

      this.blink(this.stats.immuneTime);
      this.lastDamagedTime = now;
      this.lastNinjaBananaActive = 0;
      this.delayedCall(25 * ninjaBanana + 50, () => {
        this.setVisible(true);
      });

      if (this.hasItem("boomerang")) {
        const count = 18;
        for (let i = 0; i < count; i++) {
          this.createBoomerang(i * 2 * Math.PI / count, 300);
        }
      }

      return;
    }

    if (now - this.lastDamagedTime < this.stats.immuneTime) {
      return;
    }

    this.blink(this.stats.immuneTime);
    this.lastDamagedTime = now;
    
    const isEvade = (Math.random() < this.stats.evade / 100);
    
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

      this.playSound('evade', {
        volume: 0.8,
        detune: 1000
      });
    } else {
      if (!this.isGodMode) {
        this.stats.health -= amount;
        this.events.emit('healthChanged', this.stats.health);
      }
      
      if (this.stats.health > 0) {
        this.scene.cameras.main.shake(100, 0.01);
      } else {
        this.scene.cameras.main.shake(200, 0.025);
      }

      this.playSound('hurt', {
        volume: 0.8
      })
    }
  }

  dash(): void {
    const now = this.scene.now;

    if (now - this.lastDashTime < this.stats.dashCoolDown) {
      return;
    }

    this.lastDashTime = now;

    this.playSound('dash', {
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
      this.gravity += prevGravity;
    });
    
    const immuneTime = dashSpeed + this.stats.immuneTime / 10;

    this.lastDamagedTime = now - this.stats.immuneTime + immuneTime;
    this.blink(immuneTime);

    if (this.hasItem("ninja_banana")) {
      this.lastNinjaBananaActive = this.scene.now;
      const particles = this.scene.add.particles(0, 0, 'rect-particle', {
        x: 0,
        y: 0,
        follow: this,
        lifespan: { min: 100, max: 200 },
        speed: { min: 10, max: 30 },
        scale: { start: 4, end: 0 },
        alpha: 1,
        quantity: 16,
        frequency: 50,
        tint: [0x000000],
        duration: 100,
        followOffset: { x: 0, y: 0 },
      });
      this.scene.layers.bottom.add(particles);
      this.setTint(0x000000);
      this.delayedCall(200, () => {
        this.clearTint();
      })
      this.delayedCall(750, () => {
        particles.destroy();
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
    this.stats.range = Math.max(value, 0);
  }

  get range(): number {
    return this.stats.range;
  }

  getRealRange(): number {
    return this.body!.height + this.stats.range;
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

  changeScale(value: number) {
    this.scale = value;
    this.weapons.forEach(weapon => {
      (weapon as Weapon).setScale(this.scale);
    });
  }

  get maxHealth(): number {
    return this.stats.maxHealth;
  }

  set maxHealth(value: number) {
    this.stats.maxHealth = value;
    if (this.stats.maxHealth < 1) {
      this.stats.maxHealth = 1;
    }
    this.scene.updateHealthUI();
  }

  set exp(value: number) {
    const diff = value - this._exp;
    this._exp += diff * (this.stats.expGain / 100);

    while (this._exp >= this.needExp) {
      this._exp -= this.needExp;
      this.level += 1;
      this.needExp = this.needExp + 40;

      // level up event
      this.events.emit('levelUp', this.level);
      this.playSound('levelup', {
        volume: 0.6,
        detune: 500,
      });

      // level up effect
      const levelupText = this.scene.add.bitmapText(
        this.x, this.y - this.body!.height / 2 - 24, "mini",
        `LEVEL UP`
      ).setCenterAlign().setOrigin(0.5, 0.5).setTint(0xffe091);

      this.scene.tweens.add({
        targets: levelupText,
        alpha: 0,
        y: "-=18",
        duration: 500,
        onComplete: () => {
          levelupText.destroy();
        }
      });
      this.scene.layers.ui.add(levelupText);
    }
    this.scene.updateExpBar();
  }

  get evadeCoolDown(): number {
    return this.stats.evadeCoolDown;
  }

  set evadeCoolDown(value: number) {
    this.stats.evadeCoolDown = value > 1000 ? value : 1000;
  }

  collectItem(item: string, isCursed?: boolean): void;
  collectItem(item: Item): void;

  collectItem(item: Item | string, isCursed: boolean = false, showEffect: boolean = true): void {
    if (typeof item === 'string') {
      item = createItem(item, 0, 0, this.scene, isCursed)!;
    }

    this.items[item.id] = this.items[item.id] ? this.items[item.id] + 1 : 1;
    item.onCollect();
    
    if (item instanceof CursedItem) {
      this.curse += 1;
      isCursed = true;
    }

    this.events.emit('itemCollected');

    if (!showEffect) return;

    this.playSound('collectItem', {
      volume: 0.25
    });

    if (this.itemNameText && this.itemDescText) {
      const itemNameText = this.itemNameText;
      const itemDescText = this.itemDescText;

      this.scene.tweens.add({
        targets: [itemNameText, itemDescText],
        alpha: 0,
        y: "-=8",
        duration: 500,
        onComplete: () => {
          itemNameText.destroy();
          itemDescText.destroy();
        }
      })
    }

    const itemNameText = this.itemNameText = this.scene.add.bitmapText(
      this.scene.cameras.main.width / 2, this.scene.cameras.main.height - 68, "mini",
      `${item.itemData.name}`
    ).setCenterAlign().setOrigin(0.5, 0.5);

    const itemDescText = this.itemDescText = this.scene.add.bitmapText(
      this.scene.cameras.main.width / 2, this.scene.cameras.main.height - 60, "mini",
      `${item.itemData.description}`
    ).setCenterAlign().setOrigin(0.5, 0.5).setAlpha(0.75);

    if (isCursed) {
      itemNameText.setTint(0xff6866);
      itemNameText.text = `Cursed ${item.itemData.name}`;
      itemDescText.setTint(0xff6866);
      itemDescText.text = `${item.itemData.description} and curse +1`;
    }

    this.scene.time.delayedCall(4500, () => {
      this.scene.tweens.add({
        targets: [this.itemNameText, this.itemDescText],
        alpha: 0,
        y: "-=8",
        duration: 500,
        onComplete: () => {
          itemNameText.destroy();
          itemDescText.destroy();
        }
      })
    })

    this.scene.layers.ui.add(this.itemNameText);
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

  createCircleBullet(color: number = 0x00ffff, size: number = 3, life: number = 5000, damage?: number, shadowConfig?: ShadowConfig): Phaser.GameObjects.Arc & {
    body: Phaser.Physics.Arcade.Body
  } | null {
    const scene = this.scene as GameScene;
    const player = scene.player;
    if (!scene || !scene.getBulletGroup) return null;

    if (damage === null || damage === undefined) {
      damage = this.stats.damage;
    }
    
    const bullet = scene.add.circle(this.x, this.y, size, color) as unknown as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(bullet);
    bullet.body.setCircle(size);
    
    if (scene.getBulletGroup()) {
      scene.getBulletGroup().add(bullet);
    }
    
    scene.getEffectLayer().add(bullet);
    scene.physics.add.overlap(bullet, scene.enemyGroup, (bullet: any, enemy: any) => {
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

  createSpriteBullet(spriteKey: string, atlasKey: string, damage: number, life?: number): SpriteBullet {
    const bullet = this.scene.add.sprite(this.x, this.y, atlasKey, spriteKey+"-0") as SpriteBullet;
    bullet.play(spriteKey);
    bullet.setOrigin(0.5, 0.5);
    this.scene.physics.add.existing(bullet);
    this.scene.getEffectLayer().add(bullet);
    
    this.scene.physics.add.overlap(bullet, this.scene.enemyGroup, (bullet: any, enemy: any) => {
      enemy.takeDamage(damage);
      bullet.destroy();
    });

    if (life !== undefined && life > 0) {
      this.scene.time.delayedCall(life, () => {
        if (bullet && bullet.active) {
          bullet.destroy();
        }
      });
    }

    return bullet;
  }

  addWeapon(weapon: Weapon | string): Weapon | null {
    if (typeof weapon === "string") {
      const weaponMap: { [key: string]: new (scene: GameScene, player: Player, index: number) => Weapon } = {
        sword: Sword,
        copper_sword: CopperSword,
        pickaxe: Pickaxe,
        boomerang: Boomerang,
        mace: Mace
      };

      const WeaponClass = weaponMap[weapon];
      if (!WeaponClass) return null;
      
      weapon = new WeaponClass(this.scene, this, this.weaponCount);
    }

    this.weapons.push(weapon);
    this.scene.layers.weapon.add(weapon);

    return weapon;
  }

  addMagic(magic: MagicCrystal): void {
    const hasSkill = this.magics.filter(s => s.id === magic.itemData.id);
    if (hasSkill.length === 0) {
      this.magics.push({
        id: magic.itemData.id,
        cooldown: magic.itemData.cooldown!,
        cooltime: magic.itemData.cooldown!,
        level: 1,
        effect: magic.itemData.effect,
      });
    } else {
      // 이미 있는 경우
      hasSkill[0].level += 1;
      hasSkill[0].cooltime *= 1 - (magic.itemData.cooldownForLevel ?? 0);
    }
  }

  get weaponCount(): number {
    return this.weapons.length;
  }
}

interface ShadowConfig {
  display?: boolean;
  life?: number;
  alpha?: number;
  interval?: number;
}

export default Player;