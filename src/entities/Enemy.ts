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

  constructor(states: string[], scene: GameScene, x: number, y: number) {
    super(states, scene, x, y);
    this.vx = 0;
  }
  
  set vx(value: number) {
    // if (value === this._vx) return;
    
    this._vx = value;
    this.setVelocityX(-this.scene.getPlayer().speed + value);
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

  /**
   * 데미지를 받는 메서드 - 무적 상태 체크 없이 단순화
   * @param amount 데미지 양
   * @returns 데미지 처리 여부
   */
  takeDamage(amount: number): boolean {
    // 데미지 처리
    this.health -= amount;
    
    // 피해 효과 표시 등의 작업이 있다면 여기서 처리
    this.onDamaged();
    
    return true;
  }
  
  protected onDamaged(): void {
    this.createHitEffect();
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

  private createHitEffect(): void {
    const scene = this.scene as GameScene;
    
    // 적 위치에 히트 이펙트 생성
    const hitEffect = scene.add.sprite(this.x, this.y, 'atlas', 'hit_effect-0');
    
    // 이펙트를 적절한 레이어에 추가
    scene.getEffectLayer()?.add(hitEffect);
    
    // 히트 이펙트 애니메이션이 없으면 생성
    if (!scene.anims.exists('hit_effect')) {
      scene.anims.create({
        key: 'hit_effect',
        frames: scene.anims.generateFrameNames('atlas', {
          prefix: 'hit_effect-',
          start: 0,
          end: 4  // 프레임 수는 실제 스프라이트에 맞게 조정
        }),
        frameRate: 24,
        repeat: 0
      });
    }
    
    hitEffect.play('hit_effect');
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
}