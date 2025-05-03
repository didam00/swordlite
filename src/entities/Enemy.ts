import Phaser from 'phaser';
import Entity from './Entity';
import GameScene from '../scenes/GameScene';

export default abstract class Enemy extends Entity {
  abstract stats: {
    health: number,
    damage: number,
    speed: number,
    defense: number,
    [key: string]: number,
  }

  private _vx: number = 0;
  private _vy: number = 0;
  exp: number = 10;
  level: number = 1;
  untargetability: boolean = false;
  isDamaged: boolean = false;
  isStun: boolean = false;
  isFlee: boolean = false;

  isFollowCamera: boolean = false;

  constructor(states: string[], scene: GameScene, x: number, y: number) {
    super(states, scene, x, y);
    this.vx = 0;
  }

  onSpawn(): void {

  }

  onNaturalSpawn(): void {
    
  }
  
  set vx(value: number) {
    // if (value === this._vx) return;
    this._vx = value;
    if (this.isFollowCamera) {
      this.setVelocityX(value);
    } else {
      this.setVelocityX(-this.scene.player.speed + value);
    }
  }
  
  get vx(): number {
    return this._vx;
  }
  
  set vy(value: number) {
    // if (value === this._vy) return;

    this._vy = value;
    this.setVelocityY(value);
  }

  get vy(): number {
    return this._vy;
  }

  set velocity(value: [number, number]) {
    this.vx = value[0];
    this.vy = value[1];
  }

  get velocity(): { x: number, y: number } {
    return { x: this.vx, y: this.vy };
  }

  takeDamage(amount: number, isCritical: boolean = false, type: string[] = [], data: number = 0): number {
    if (this.isDead || this.untargetability) return 0;

    amount -= this.stats.defense;

    if (this.untargetability) return 0;
    if (amount <= 0) return 0;

    this.health -= amount;
    this.onDamaged(amount, isCritical);
    this.isDamaged = true;

    const lightningRod = this.scene.player.hasItem("lightning_rod");

    if (lightningRod > 0 && data >= 0 && amount > 0 && (type.includes("attack") || type.includes("lightning"))) {
      this.addStatusEffect("lightning_rod", 500);

      let nearEnemies = this.scene.enemies
        .filter((enemy) => enemy !== this)
        .filter((enemy) => !enemy.hasStatusEffect("lightning_rod"))

      if (nearEnemies.length > 0) {
        const nearestEnemy = nearEnemies.reduce((prev, curr) => {
          const prevDist = Phaser.Math.Distance.Between(this.x, this.y, prev.x, prev.y);
          const currDist = Phaser.Math.Distance.Between(this.x, this.y, curr.x, curr.y);
          return (currDist < prevDist) ? curr : prev;
        }, nearEnemies[0]);

        if (nearestEnemy) {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
  
          if (dist < 80 * (1 + this.scene.player.stats.mana / 100)) {
            if (!type.includes("lightning_rod")) {
              data = lightningRod;
            }
            nearestEnemy.takeDamage(Math.floor(amount * (0.7 + lightningRod / 10)), isCritical, ["magic", "lightning", "lightning_rod"], data - 2);
            nearestEnemy.addStatusEffect("lightning_rod", 500);
  
            // effect
            const midX = (this.x + nearestEnemy.x) / 2;
            const midY = (this.y + nearestEnemy.y) / 2;
            const angle = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y) + Math.PI / 2;
  
            const effect = this.scene.add.sprite(midX, midY, 'effects', 'lightning-0');
            effect.play('lightning');
  
            effect.displayHeight = dist;
            effect.rotation = angle;
  
            this.scene.layers.effect.add(effect);
            
            this.scene.time.delayedCall(150, () => {
              effect.destroy();
            })
          }
        }
      }
    }

    return amount;
  }
  
  onDamaged(amount: number, isCritical: boolean): void {
    this.createHitEffect(amount, isCritical);
    this.blink();
    
    if (this.health > 0) {
      this.playSound('hit', {
        volume: 0.2,
        // detune: -1000,
        rate: 1.5,
      });
    }

    // if (this.scene.debugMode) {
    if (true) {
      const damageText = this.scene.add.bitmapText(
        this.x,
        this.y,
        'mini',
        Math.floor(amount).toString(),
        10
      );

      damageText.setOrigin(0.5, 0.5);
      // damageText.setTint(0xd83843);
      damageText.setTint(0xffffff);

      const angle = Math.random() * Math.PI * 2;
      this.scene.physics.add.existing(damageText);
      
      const body = damageText.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 50, Math.sin(angle) * 50);
      body.setGravityY(300);
      body.setSize(0, 0);

      this.scene.layers.top.add(damageText);

      this.scene.time.delayedCall(500, () => {
        damageText.destroy();
      });
    }
  }

  private createHitEffect(amount: number, isCritical: boolean): void {
    const scene = this.scene as GameScene;
    const texture = isCritical ? 'critical_hit' : 'hit';

    const x = this.x + Math.random() * this.body!.width - this.body!.width / 2;
    const y = this.y + Math.random() * this.body!.height - this.body!.height / 2;
    
    // 적 위치에 히트 이펙트 생성
    const hitEffect = scene.add.sprite(x, y, 'effects', texture + '-0');
    hitEffect.setScale(isCritical ? 0.75 : 1);
    
    // 이펙트를 적절한 레이어에 추가
    scene.getEffectLayer()?.add(hitEffect);
    
    // 히트 이펙트 애니메이션이 없으면 생성
    if (!scene.anims.exists(texture)) {
      scene.anims.create({
        key: texture,
        frames: scene.anims.generateFrameNames('effects', {
          prefix: texture + '-',
          start: 0,
          end: isCritical ? 7 : 4
        }),
        frameRate: 24,
        repeat: 0
      });
    }
    
    hitEffect.play(texture);
    hitEffect.setRotation(Phaser.Math.Between(0, 360));
    hitEffect.on('animationcomplete', () => {
      hitEffect.destroy();
    });
  }

  createBullet(color: number = 0x00ffff, size: number = 3, life: number = 5000, damage: number = 1, config: BulletConfig = {}): CircleBullet | null {
    const scene = this.scene as GameScene;
    const player = scene.player;

    config = {
      drag: 1, /** 초당 줄어드는 비율 */
      speed: [0, 0],
      strokeWidth: 0,
      strokeColor: 0xffffff,
      ...config,
    }

    if (!scene || !scene.getBulletGroup) return null;

    if (damage === null || damage === undefined) {
      damage = this.stats.damage;
    }
    
    const bullet = scene.add.circle(this.x, this.y, size, color) as CircleBullet;
    bullet.setStrokeStyle(config.strokeWidth!, config.strokeColor!);
    
    scene.physics.add.existing(bullet);
    bullet.body.setCircle(size);

    if (scene.getBulletGroup()) {
      scene.getBulletGroup().add(bullet);
    }
    
    scene.getEffectLayer().add(bullet);
    scene.physics.add.overlap(bullet, scene.player, () => {
      player.takeDamage(damage);
      bullet.destroy();
    });

    if (config.drag! < 1) {
      const scene = this.scene;

      const dragUpdate = (time: number, delta: number) => {
        if (!bullet || !bullet.active) {
          scene.events.off('update', dragUpdate, this);
          return;
        }

        config.speed![0] *= config.drag! ** (delta / 1000);
        config.speed![1] *= config.drag! ** (delta / 1000);

        bullet.body.setVelocity(
          config.speed![0] - scene.player.speed!,
          config.speed![1],
        )
      }

      this.scene.events.on('update', dragUpdate, this);

    } else {
      bullet.body.setVelocity(
        config.speed![0] - scene.player.speed!,
        config.speed![1],
      )
    }
    
    if (life > 0) {
      scene.time.delayedCall(life, () => {
        if (bullet && bullet.active) {
          bullet.destroy();
        }
      });
    }

    bullet.owner = this;
    bullet.isBullet = true;
    bullet.damage = 1;

    return bullet;
  }

  update(delta: number): void {
    if (this.isStun) return;
  }

  // when player speed updated
  playerSpeedUpdated(diff: number): void {

  }

  takeStun(time: number): void {
    this.isStun = true;
    this.setTint(0x4185d8);
    this.removeAllStates();
    this.vx = 0;
    this.vy = 0;
    for (const timerEvent of this.delayEvents) {
      timerEvent.remove(false);
    }
    this.delayedCall(time, () => {
      this.clearTint();
      this.isStun = false;
    });
  }

  takeFlee(time: number): void {
    this.isStun = true;
    this.isFlee = true;
    this.setTint(0x8c51cc);
    this.removeAllStates();
    for (const timerEvent of this.delayEvents) {
      timerEvent.remove(false);
    }
    this.delayedCall(time, () => {
      this.clearTint();
      this.isStun = false;
      this.isFlee = false;
    });

    // this.scene.physics.moveToObject(this,
    //   this.scene.player,
    //   -this.scene.player.stats.speed - 10,
    // );
  }
}

// 기본 Bullet 인터페이스 정의
export interface Bullet {
  owner: Enemy;
  isBullet: boolean;
  body: Phaser.Physics.Arcade.Body;
  damage: number;
}

export interface BulletConfig {
  drag?: number;
  speed?: [number, number];
  strokeWidth?: number;
  strokeColor?: number;
}

// 특정 형태의 총알 타입 정의 (타입 교차를 통한 확장)
export type CircleBullet = Phaser.GameObjects.Arc & Bullet;
export type SpriteBullet = Phaser.GameObjects.Sprite & Bullet;
export type GraphicsBullet = Phaser.GameObjects.Graphics & Bullet;

// 모든 총알 타입을 포함하는 유니언 타입
export type AnyBullet = CircleBullet | SpriteBullet | GraphicsBullet;