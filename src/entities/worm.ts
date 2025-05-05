import Phaser from 'phaser';
import Enemy from './Enemy';
import GameScene from '../scenes/GameScene';

export default class Worm extends Enemy {
  entityName = 'worm';
  exp = 10;

  stats = {
    health: 5,
    damage: 1,
    speed: 80,
    scale: 1,
    defense: 1,
  }

  constructor(scene: GameScene, x: number, y: number) {
    super([
      "idle"
    ], scene, x, y);

    this.setSize(12, 8);
    
    this.createAnimations();
    this.updateAnimation();
  }
  
  createAnimations(): void {
    this.createAnimation('worm_idle', [0, 8], 12);
  }

  update(delta: number) {
    
  }
}