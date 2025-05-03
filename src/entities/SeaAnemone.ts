import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';

export default class SeaAnemone extends Enemy {
  entityName = 'sea_anemone';
  exp = 10;
  lastChargeTime = 0;
  cooldownTime = 2000;

  stats = {
    health: 8,
    damage: 1,
    speed: 0,
    scale: 1,
    defense: 0,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle", "charge"
    ], scene, x, y);

    this.setSize(16, 24);
    
    this.createAnimations();
    this.updateAnimation();
  }

  onSpawn(): void {
    // 바닥에 붙어있기
    this.y = this.scene.cameras.main.height - this.body!.height / 2 + 1;

    this.delayedCall(1000 + 2000 * Math.random(), () => {
      this.cooldownTime = 4000;
    })
  }
  
  createAnimations(): void {
    this.createAnimation('sea_anemone_idle');
    this.createAnimation('sea_anemone_charge', [0, 5], 5, 0);
  }
  
  update(delta: number) {
    super.update(delta);

    const now = this.scene.now;

    if (this.cooldownTime !== 0 && now - this.lastChargeTime > this.cooldownTime) {
      this.addState('charge');

      this.delayedCall(1000 / 5 * 4, () => {
        const count = 2 * (this.level + 1);
  
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI / 8 - Math.PI / 16 - Math.PI / 2;
          const speed = Phaser.Math.Between(100, 500);
  
          const bullet = this.createBullet(0x22896e, Phaser.Math.Between(4, 8), Math.random() * 1000 + 2000, 1, {
            drag: 0.1,
            speed: [
              Math.cos(angle) * (speed),
              Math.sin(angle) * (speed),
            ],
            // strokeWidth: 1,
            // strokeColor: 0x42bc7f,
          });
        }

        this.playSound('rocket', {
          volume: 1.5,
          rate: 0.2,
          detune: 500,
        })
      })
  
      this.delayedCall(1000, () => {
        this.removeState('charge');
      })

      this.lastChargeTime = now;
    }
  }
}