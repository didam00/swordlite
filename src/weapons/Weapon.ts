import Phaser from 'phaser';
import Player from '../entities/Player';
import GameScene from '../scenes/GameScene';
import Enemy from '../entities/Enemy';

abstract class Weapon extends Phaser.GameObjects.Sprite {
  readonly player: Player;
  readonly scene: GameScene;
  positionAngle: number = 0;
  private index: number = 0;
  readonly weaponName: string;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter = null!;
  private lastAttackTime: number = 0;
  private attackEffect: Phaser.GameObjects.Sprite | null = null;
  private isAttacking: boolean = false;
  private attackBody: Phaser.Physics.Arcade.Body | null = null;
  private hitEnemies: Enemy[] = [];
  particleColor: number[] = [0xffffff];
  useDefaultAttackEffect: boolean = true;
  attackEffectColor: number = 0xffffff;
  dontAttack: boolean = false;

  private pointer: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };
  option: {
    attack: number,
    range: number,
    cooldown: number,
    angleArea: number,
  } = {
    attack: 100,
    range: 100,
    cooldown: 0,
    angleArea: 360,
  }
  
  constructor(scene: GameScene, player: Player, name: string, index: number) {
    super(scene, player.x, player.y, 'atlas', `${name}-0`);
    this.player = player;
    this.scene = scene;
    this.index = index;
    this.weaponName = name;
  }

  init() {
    this.initEvents();
    this.addEmitter();
    this.createAnimations();
  }

  createAnimations() {
    let animName = `sword_attack`;

    if (!this.useDefaultAttackEffect) {
      animName = `${this.weaponName}_attack`;
    }

    this.scene.createAnimation(
      'effects',
      animName,
      [0, 4], 
      24, 
      0
    );
  }

  initEvents() {
    this.scene.input.on('pointermove', this.onMouseMove, this);
    this.player.onJump(this.onJump, this);
  }

  addEmitter() {
    const spreadSpeed = 10;

    this.emitter = this.scene.add.particles(0, 0, 'rect-particle', {
      x: 0,
      y: 0,
      follow: this,
      lifespan: 750,
      speed: { min: 0, max: spreadSpeed },
      scale: { start: 2, end: 0 },
      // alpha: 0.5,
      quantity: 1,
      frequency: 100,
      tint: this.particleColor,
    });

    this.scene.layers.bottom.add(this.emitter);
  }

  onJump() {
    if (!this.dontAttack) {
      const weaponCount = this.scene.player.weaponCount;
  
      const now = this.scene.now;
      if (now - this.lastAttackTime < this.player.stats.attackCoolDown * (this.option.cooldown / 100)) {
        return;
      }
  
      this.lastAttackTime = now;
  
      const dx = this.pointer.x - this.player.x;
      const dy = this.pointer.y - this.player.y;
      const angle = Math.atan2(dy, dx) + (this.index / weaponCount) * Math.PI * 2;
      
      this.setVisible(false);
      this.isAttacking = true;
      this.player.addState("attack");
      
      this.hitEnemies = [];
      const radius = this.getDist() + 4;
      this.attackBody = this.scene.physics.add.body(
        this.player.x - radius, this.player.y - radius
      ).setCircle(radius);
      
      this.drawAttackEffect(angle - Math.PI / 4, () => {
        this.setVisible(true);
        this.isAttacking = false;
        this.player.removeState("attack");
  
        if (this.attackBody) {
          this.attackBody.destroy();
        }
      });
  
      const windyFan = this.player.hasItem("windy_fan");
      if (windyFan) {
        this.scene.time.delayedCall((this.player.weaponCount - this.index - 1) * 50, () => {
          const scene = this.scene;
    
          const windy_attack = scene.add.sprite(
            scene.player.x, scene.player.y - 8, 'effects', 'windy_attack-0'
          ).play('windy_attack');
          scene.physics.add.existing(windy_attack);
          windy_attack.setOrigin(0.5, 0.5);
          windy_attack.setTint(this.particleColor[0]);
      
          const body = windy_attack.body as Phaser.Physics.Arcade.Body;
          windy_attack.setScale(1, Math.min(scene.player.range / 30));
          body.setSize(32, 64);

          if (this.player.hasItem("portable_mirror")) {
            const portableMirrorUpdate = () => {
              this.applyPortableMirror(body);
            }
            this.scene.events.on('update', portableMirrorUpdate);
          }
  
          const speed = 900;
          let angle = 0;
          if (this.option.angleArea < 360) {
            angle = this.positionAngle;
          }
  
          windy_attack.setRotation(angle);
          body.setVelocity(
            Math.cos(angle) * speed - scene.player.stats.speed,
            Math.sin(angle) * speed
          );
      
          // 엔티티와 충돌하면 사라지고 플레이어 공격력만큼 데미지
          scene.physics.add.collider(windy_attack, scene.enemyGroup, (light, enemy) => {
            const isCritcal = Math.random() < (this.player.stats.criticalChance / 100);
            const damage = isCritcal ? this.player.damage * 1.5 : this.player.damage;
            (enemy as Enemy).takeDamage(damage, isCritcal, ["attack"]);
            light.destroy();
          });
      
          this.scene.time.delayedCall(windyFan * 125 + this.player.range * (this.option.range / 100) - 50, () => {
            if (windy_attack && windy_attack.active) {
              windy_attack.destroy();
            }
          });
      
          scene.getEffectLayer().add(windy_attack);
        })
      }
    }
  }

  drawAttackEffect(angle: number, callback: () => void = () => {}) {
    if (this.attackEffect) {
      this.attackEffect.destroy();
    }

    this.attackEffect = this.scene.add.sprite(
      this.player.x,  // 플레이어의 x 위치
      this.player.y,  // 플레이어의 y 위치
      'effects',
      'sword_attack-0'
    );

    this.attackEffect.setOrigin(0.5, 0.5);
    this.attackEffect.setRotation(angle);
    this.attackEffect.setScale(this.getDist() / 40);
    this.attackEffect.setTint(this.attackEffectColor);
    
    this.scene.layers.effect.add(this.attackEffect);

    if (!this.useDefaultAttackEffect) {
      this.attackEffect.play(this.weaponName + '_attack');
    } else {
      this.attackEffect.play('sword_attack');
    }
    
    this.attackEffect.on('animationcomplete', () => {
      if (this.attackEffect) {
        this.attackEffect.destroy();
        this.attackEffect = null;
      }
      
      callback();
    });
  }

  onMouseMove(pointer: Phaser.Input.Pointer) {
    this.pointer.x = pointer.x;
    this.pointer.y = pointer.y;
  }
  
  update() {
    if (this.scene.now - this.lastAttackTime < this.player.stats.attackCoolDown * (this.option.cooldown / 100)) {
      this.setAlpha(0.5);
    } else {
      this.setAlpha(1);
    }

    if (this.isAttacking && this.attackEffect && this.attackBody) {
      this.attackEffect.setPosition(this.player.x, this.player.y);
      this.attackBody.position.x = this.player.x - this.attackBody.width / 2;
      this.attackBody.position.y = this.player.y - this.attackBody.height / 2;

      for (const enemy of this.scene.enemies) {
        if (this.hitEnemies.includes(enemy)) {
          continue;
        }
        
        if (this.scene.physics.world.overlap(this.attackBody, enemy.body!)) {
          let isHit = false;

          if (this.option.angleArea < 360) {
            const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            const angleDiff = Math.abs(
              Phaser.Math.Angle.ShortestBetween(
                Phaser.Math.RadToDeg(enemyAngle),
                Phaser.Math.RadToDeg(this.positionAngle)
              )
            ) * Phaser.Math.DEG_TO_RAD;
            if (angleDiff <= Phaser.Math.DegToRad(this.option.angleArea / 2)) {
              isHit = true;
            };
          } else {
            isHit = true;
          }
          if (isHit) {
            this.onAttack(enemy);
            this.hitEnemies.push(enemy);
          }
        }
      }

      this.applyPortableMirror(this.attackBody);
    }
    this.updateWeaponPosition();
  }
  
  updateWeaponPosition() {
    const weaponCount = this.scene.player.weapons.length;
    // 검의 보여지는 크기까지 고려
    const dist = this.getDist();
    
    const dx = this.pointer.x - this.player.x;
    const dy = this.pointer.y - this.player.y;
    
    this.positionAngle = Phaser.Math.Angle.Normalize(
      Math.atan2(dy, dx) + (Math.PI * 2 * (this.index / weaponCount))
    );
    
    // update weapon positiion
    this.x = this.player.x + Math.cos(this.positionAngle) * dist;
    this.y = this.player.y + Math.sin(this.positionAngle) * dist;
    
    // update weapon image
    const STEP_COUNT = 8;
    const STEP = Math.PI / (STEP_COUNT / 2);
    const HALF_STEP = STEP / 2;
    const frameIndex = Math.floor((this.positionAngle + Math.PI / 2 + HALF_STEP) / STEP) % STEP_COUNT;
    this.setFrame(`${this.weaponName}-${frameIndex}`);
  }

  onAttack(enemy: Enemy) {
    const isCritcal = Math.random() < (this.player.stats.criticalChance / 100);
    const preDamage = (this.player.damage + this.player.stats.trueAttack) * this.option.attack / 100;
    const damage = isCritcal ? preDamage * 2 : preDamage;
    enemy.takeDamage(Math.floor(damage), isCritcal, ["attack"]);

    this.scene.playSound('attack', {
      volume: 0.8
    })
  }

  applyPortableMirror(body: Phaser.Physics.Arcade.Body): void {
    const portableMirror = this.player.hasItem("portable_mirror");

    if (portableMirror) {
      for (const bullet of this.scene.getBulletList()) {
        if (this.scene.physics.world.overlap(body, (bullet.body as Phaser.Physics.Arcade.Body))) {
          if (this.option.angleArea < 360) {
            const bulletAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, bullet.x, bullet.y);
            const angleDiff = Math.abs(
              Phaser.Math.Angle.ShortestBetween(
                Phaser.Math.RadToDeg(bulletAngle),
                Phaser.Math.RadToDeg(this.positionAngle)
              )
            ) * Phaser.Math.DEG_TO_RAD;
            if (angleDiff > Phaser.Math.DegToRad(this.option.angleArea / 2)) {
              continue;
            };
          }

          const [x, y] = [bullet.body?.position.x, bullet.body?.position.y];
          const owner = bullet.owner;
          let size = 0;
          if (bullet.body.isCircle) {
            size = bullet.body.radius * 2;
          } else {
            size = (bullet.body.width * bullet.body.height) ** 0.5;
          }

          this.scene.time.delayedCall(bullet.config.emitterDeleteTime ?? 0, () => {
            bullet.config.emitter?.destroy();
          });

          bullet.destroy();

          for (let i = 0; i < size / 20 * portableMirror * 2 + size * (this.player.stats.mana / 200); i++) {
            const lightBullet = this.scene.add.sprite(x!, y!, 'effects', 'light_bullet-0').play('light_bullet');
            this.scene.physics.add.existing(lightBullet);
  
            // lightBullet.play('light_bullet');
            lightBullet.setOrigin(0.5, 0.5);
            const scale = Math.random() * 0.5 + 0.25 + (portableMirror * 0.05)
            lightBullet.setScale(scale);
            lightBullet.setAlpha(0.9);
            // lightBullet.rotation = Math.random() * Math.PI * 2;
            
            const body = lightBullet.body as Phaser.Physics.Arcade.Body;
            
            body.setSize(10, 10);

            // const randRotation = Math.random() * Math.PI * 2;
            const speed = (100 * Math.random() + 300) * (portableMirror * 0.25 + 0.75);

            // body.setVelocity(
            //   Math.cos(randRotation) * speed - this.player.speed,
            //   Math.sin(randRotation) * speed
            // );
            
            const moveAngle = Phaser.Math.Angle.Between(
              this.player.x, this.player.y,
              lightBullet.x, lightBullet.y,
            ) + (Math.PI / 8 * portableMirror) * (Math.random() - 0.5);

            body.setVelocity(
              Math.cos(moveAngle) * speed - this.player.speed,
              Math.sin(moveAngle) * speed
            );

            body.setDrag(400 * (portableMirror * 0.2 + 0.8), 400 * (portableMirror * 0.2 + 0.8));
  
            this.scene.physics.add.collider(lightBullet, this.scene.enemyGroup, (light, enemy) => {
              if (this.hitEnemies.includes(enemy as Enemy)) {
                return;
              }
              const damage = this.player.damage * portableMirror / 2;
              (enemy as Enemy).takeDamage(damage, false, ["magic", "light"]);
              lightBullet.destroy();
              this.hitEnemies.push(enemy as Enemy);
            });
  
            this.scene.layers.effect.add(lightBullet);

            this.scene.time.delayedCall((Math.random() * 500 + 50) * (1 + this.player.stats.mana / 400), () => {
              if (lightBullet) {
                lightBullet.destroy();
              }
            })
          }
        }
      }
    }
  }

  /** 수치상 실제 거리 */
  getDist(): number {
    return this.player.body!.height + this.player.range * this.option.range / 100 - 4
  }
}

export default Weapon;