import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';
import { hsvToHex } from '../utils/hsvToHex';

// 물고기 모양으로 떼를 지어 다니며
export default class BlueFish extends Enemy {
  entityName = 'blue_fish';
  exp = 4;
  clockwise: boolean = false;
  stepSize: number = 0.1;
  isMainSpawn: boolean = false;

  moveSpeedX: number = 15;

  stats = {
    health: 4,
    damage: 1,
    speed: 15,
    scale: 1,
    defense: 1,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle"
    ], scene, x, y);

    this.setSize(12, 6);
    this.stats.speed = Math.random() * 5 + 15;
    this.stats.health = Math.floor(Math.random() * 5 + 2);
    this.stats.defense = Math.floor(Math.random() * 2 + 1);

    this.createAnimations();
    this.updateAnimation();
    // const color = hsvToHex(Phaser.Math.Between(180, 280), 0.8, 1);
    // this.setTint(color);
  }

  onNaturalSpawn(): void {
    const count = Phaser.Math.Between(2, 5) * (0.5 + this.level * 0.5);
    for (let i = 0; i < count; i++) {
      const x = this.x + Phaser.Math.Between(-20, 20);
      const y = this.y + Phaser.Math.Between(-20, 20);
      const enemy = this.scene.spawnEnemy("blue_fish");
      enemy?.setPosition(x, y);
    }
  }
  
  createAnimations(): void {
    this.createAnimation('blue_fish_idle', [0, 3], 12);
    // this.createAnimation('squid_charge', 'squid_idle', [0, 7], 16);
  }
  
  update(delta: number) {
    super.update(delta);
    this.vx = -this.stats.speed
  }
}