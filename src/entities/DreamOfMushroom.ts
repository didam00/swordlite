import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import RedMushroom from './RedMushroom';
import FakeRedMushroom from './FakeRedMushroom';

export default class DreamOfMushroom extends Enemy {
  entityName = 'dream_of_mushroom';
  isFollowCamera: boolean = true;
  lastCoolTime: number = 0;
  lastTransformTime: number = 0;
  rotationClockwise: number = 1;
  isSizeup: number = 1;
  isClose: boolean = false;
  destroyOnScreenOut = false;
  mode: string = 'idle';
  modes: string[] = ['spawn_red_mushrooms', 'shot'];
  prevMode: string = 'idle';
  scaleRate: number = 1;
  exp: number = 500;

  stats = {
    health: 200,
    attack: 2,
    speed: 40,
    scale: 1,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "immune", "idle", "shot", "charge", "charging"
    ], scene, x, y);

    // 환각으로 인해 더 커보이는 컨셉
    this.body!.setSize(20, 20);
    this.setScale(this.stats.scale);
    this.rotation = - Math.PI / 2;

    this.lastTransformTime = this.scene.time.now - 2000;

    this.createAnimations();
    this.updateAnimation();
  }

  createAnimations(): void {
    this.createAnimation('dream_of_mushroom_idle', [0, 4], 12);

    this.createAnimation('dream_of_mushroom_charging', 'red_mushroom_charging', [0, 2], 4, 0);
    this.createAnimation('dream_of_mushroom_charge', 'red_mushroom_charge', [0, 1]); 
    this.createAnimation('dream_of_mushroom_shot', [0, 3], 8); 
  }

  randomTransform(): void {
    this.prevMode = this.mode;
    
    this.mode = Phaser.Utils.Array.GetRandom(this.modes);
    // this.mode = "shot";
    console.log(this.mode);
    
    this.lastTransformTime = this.scene.time.now;
    this.lastCoolTime = this.scene.time.now;
    
    if (this.mode != "spawn_red_mushrooms" && this.prevMode === "spawn_red_mushrooms") {
      const omode = this.mode;
      this.mode = this.prevMode;
      
      this.scene.time.delayedCall(1500, () => {
        if (this.isDestroyed) return;

        this.removeState("charging");
        this.removeState("charge");

        this.alpha = 0;
        this.mode = omode;

        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          duration: 1000,
        });

        this.isFollowCamera = true;
        this.setVelocityX(0);
        this.setVelocityY(0);
        this.x = this.scene.cameras.main.width - 100;
        this.y = Math.random() * (this.scene.cameras.main.height - 40) + 20;
        this.rotation = this.getAngle(this.scene.player) + Math.PI / 2;
      })
    }

    if (this.prevMode === "shot") {
      this.removeState("shot");
      console.log("shot: " + this.hasState("shot"));
      this.lastCoolTime += 1000;
    }
    
    if (this.mode === "spawn_red_mushrooms") {
      if (this.prevMode != "spawn_red_mushrooms") {
        this.untargetability = true;
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 1000,
        });
      }

      this.lastTransformTime = this.scene.time.now + 1000;
    }
    
    if (this.mode === "shot") {

    }
  }

  update(delta: number) {
    // const x = Math.floor(this.x);
    // const y = Math.floor(this.y);
    
    // // 화면 영역 확인
    // const isOutOfBounds = 
    //   x < 0 || 
    //   x > this.scene.cameras.main.width || 
    //   y < 0 || 
    //   y > this.scene.cameras.main.height;
    
    // if (isOutOfBounds) {
    //   // 화면 벗어남 - 빨간색으로 출력
    //   console.log('%cx:' + x + '\t y:' + y, 'color: red; font-weight: bold');
    // } else {
    //   // 화면 내부 - 일반 출력
    //   console.log(`x: ${x}\t y: ${y}`);
    // }

    const now = this.scene.time.now;

    if (now - this.lastTransformTime > 5000) {
      this.lastTransformTime = this.scene.time.now;
      this.randomTransform();
    }

    if (this.mode === "spawn_red_mushrooms" && now - this.lastCoolTime > 1500) {
      this.isFollowCamera = false;
      this.untargetability = false;

      this.setPosition(
        this.scene.cameras.main.width - (Math.random() * 50 + 50),
        Math.random() * (this.scene.cameras.main.height - 40) + 20
      );

      this.addState('charging');
      this.stopBlink();

      this.scene.time.delayedCall(500, () => {
        if (!this.isDestroyed) {
          this.removeState('charging');
          this.addState('charge');
  
          this.scene.playSound('charge', {
            volume: 0.4,
            detune: 1000,
          });
          
          this.scene.time.delayedCall(1000, () => {
            if (!this.isDestroyed) {
              this.removeState('charge');
            }
          });
        }
      });

      const count = 3;
      for (let i = 0; i < count; i++) {
        const redMushroom = this.scene.spawnEnemy("fake_red_mushroom") as FakeRedMushroom;
        redMushroom.setPosition(
          this.scene.cameras.main.width - (Math.random() * 50 + 50),
          Math.random() * (this.scene.cameras.main.height - 40) + 20
        );
        redMushroom.addState("charging");
        redMushroom.isPlayerInSight(this.scene.player);
        redMushroom.rotation
          = redMushroom.getAngle(this.scene.player) + Math.PI / 2 + Math.random() * Math.PI / 8 - Math.PI / 16;
      }
      this.lastCoolTime = now;
    }

    if (this.mode === "spawn_red_mushrooms" && this.hasState('charge')) {
      let speed = 350;
      if (this.getDist(this.scene.player) > 150 && !(this.x < this.scene.player.x + 10)) {
        this.rotation = this.getAngle(this.scene.player) + Math.PI / 2;
      }
      this.vx = Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = Math.sin(this.rotation - Math.PI / 2) * speed;
      
    } else if (this.mode === "spawn_red_mushrooms" && this.hasState('charging')) {
      const speed = 30;
      this.rotation = this.getAngle(this.scene.player) + Math.PI / 2;
      this.vx = -Math.cos(this.rotation - Math.PI / 2) * speed;
      this.vy = -Math.sin(this.rotation - Math.PI / 2) * speed;
    } else {
      // follow player
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.scene.player.x, this.scene.player.y) + Math.PI / 2;
  
      if (this.x > this.scene.cameras.main.width - 100) {
        this.vx = -this.stats.speed;
        this.vy = Math.sin(angle - Math.PI / 2) * this.stats.speed * 4;
      } else {
        this.vx = 0;
        this.vy = Math.sin(angle - Math.PI / 2) * this.stats.speed * 4;
      }
  
      const angleDiff = Phaser.Math.Angle.Wrap(angle - this.rotation);
      this.rotation += angleDiff / 480 * delta;
    }

    if (this.mode === 'shot' && now - this.lastCoolTime > 500) {
      if (!this.hasState('shot')) {
        this.addState('shot');
      }
      this.lastCoolTime = now;
      this.scene.time.delayedCall(125 * 3, () => {
        if (this.isDestroyed) return;

        for (let i = 0; i < 3; i++) {
          const angle = this.rotation - Math.PI / 16 + Math.PI / 16 * i;
          
          for (let j = 0; j < 8; j++) {
            const bullet = this.shotToPlayer(angle + Math.PI / 16 * i, Math.random() * 3 + 1, 200, 2000);
            // const dist = Math.floor(Math.random() * 65) ** 0.5
            // const r = Math.random() * Math.PI * 2;
            bullet?.setPosition(
              bullet.x + Math.random() * 11 - 5,
              bullet.y + Math.random() * 11 - 5,
            )
          }
        }
      })
      this.scene.playSound('charge', {
        volume: 0.4,
        detune: 1000,
      });
    }
  }

  shotToPlayer(toRotate: number, size: number, speed: number, life: number): (Phaser.GameObjects.Arc & {
    body: Phaser.Physics.Arcade.Body;
  }) | null {
    if (this.health <= 0 || !this.active) {
      return null;
    }
    
    const bullet = this.createBullet(Phaser.Utils.Array.GetRandom([0x3949ac, 0x5283d2, 0x73b7e1]), size, life);
    bullet?.setPosition(
      this.x + Math.cos(this.rotation - Math.PI / 2) * this.width / 2,
      this.y + Math.sin(this.rotation - Math.PI / 2) * this.width / 2
    );
    bullet?.body.setVelocity(
      Math.cos(toRotate - Math.PI / 2) * speed,
      Math.sin(toRotate - Math.PI / 2) * speed
    );

    bullet?.body.setGravityY(20);
    return bullet;
  }

  dead() {
    this.scene.bossIsDead = true;
  }
}