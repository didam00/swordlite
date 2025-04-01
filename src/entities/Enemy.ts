import Phaser from 'phaser';
import Entity from './Entity';
import GameScene from '../scenes/GameScene';

export default abstract class Enemy extends Entity {
  abstract stats: {
    health: number,
    attack: number,
    speed: number,
    [key: string]: number,
  }

  private _vx: number = 0;
  private _vy: number = 0;
  exp: number = 20;
  untargetability: boolean = false;

  isFollowCamera: boolean = false;

  constructor(states: string[], scene: GameScene, x: number, y: number) {
    super(states, scene, x, y);
    this.vx = 0;
  }
  
  set vx(value: number) {
    // if (value === this._vx) return;
    this._vx = value;
    if (this.isFollowCamera) {
      this.setVelocityX(value);
    } else {
      this.setVelocityX(-this.scene.getPlayer().speed + value);
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

  set velocity(value: {x: number, y: number}) {
    this.vx = value.x;
    this.vy = value.y;
  }

  get velocity(): { x: number, y: number } {
    return { x: this.vx, y: this.vy };
  }

  takeDamage(amount: number, isCritical: boolean = false): number {
    if (amount <= 0) return 0;

    this.health -= amount;
    this.onDamaged(amount, isCritical);
    
    return amount;
  }
  
  protected onDamaged(amount: number, isCritical: boolean): void {
    this.createHitEffect(amount, isCritical);
    this.blink();
    
    if (this.health <= 0) {
      this.scene.playSound('hit', {
        volume: 0.4,
        rate: 1.5,
      });
    } else {
      this.scene.playSound('hit', {
        volume: 0.2,
        // detune: -1000,
        rate: 1.5,
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

  createBullet(color: number = 0x00ffff, size: number = 3, life: number = 5000, damage?: number): Phaser.GameObjects.Arc & {
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
    scene.physics.add.overlap(bullet, scene.getPlayer(), () => {
      player.takeDamage(damage);
      bullet.destroy();
    });
    
    if (life > 0) {
      scene.time.delayedCall(life, () => {
        if (bullet && bullet.active) {
          bullet.destroy();
        }
      });
    }

    return bullet;
  }

  // when player speed updated
  playerSpeedUpdated(diff: number): void {

  }
}