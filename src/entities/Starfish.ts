import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';

export default class Starfish extends Enemy {
  entityName = 'starfish';
  exp = 10;
  wasCharged: boolean = false;
  wasDamaged: boolean = false;
  isBombed: boolean = false;

  stats = {
    health: 8,
    damage: 1,
    speed: 0,
    scale: 1,
    defense: 5,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle", "charge"
    ], scene, x, y);

    // this.rotation = Math.random() * Math.PI * 2;
    this.rotation = Phaser.Math.Between(0, 3) * Math.PI / 2;
    this.setSize(18, 18);
    
    this.createAnimations();
    this.updateAnimation();
  }
  
  createAnimations(): void {
    this.createAnimation('starfish_idle', [0, 3], 4);
    this.createAnimation('starfish_charge', [0, 6], 8, 0);
  }

  onDamaged(amount: number, isCritical: boolean): void {
    super.onDamaged(amount, isCritical);
    this.wasDamaged = true;
  }
  
  update(delta: number) {
    super.update(delta);
    
    if ((this.getDist(this.scene.player) < 60 + 10 * this.level || this.wasDamaged) 
      && !this.isBombed && !this.hasState('charge')
    ) {
      this.addState('charge');
      this.wasCharged = true;

      this.delayedCall(1000 / 4 * 3, () => {
        if (this.isDead) return;
        const count = 50 * (0.5 + this.level * 0.5);
        // const emptyAngle = Math.random() * Math.PI - Math.PI / 2;

        for (let i = 0; i < count; i++) {
          const angle = this.rotation + Math.floor(Math.random() * 5) * (Math.PI * 2 / 5) + Math.PI;
          const val = Phaser.Math.Between(60, 200)
          const speed = val * (0.8 + this.level * 0.2);

          const bullet = this.createBullet(val < 80 ? 0x8c51cc : 0x643499, Math.floor(600 / speed) + 2, Math.random() * 2500 + 4500, 1, {
            drag: 0.025,
            speed: [
              Math.cos(angle) * (speed - 30),
              Math.sin(angle) * (speed - 30),
            ],
          });
        }

        this.isBombed = true;
        
        this.playSound("bubble", {
          volume: 0.6,
          detune: -800,
        })
      })

      this.delayedCall(1000, () => {
        this.removeState('charge');
      })
    }

    this.rotation += 0.0001 * delta;
    this.velocity = [0, 0];
  }
}