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
  private _scene: GameScene = null!;

  constructor(states: string[], scene: GameScene, x: number, y: number) {
    super(states, scene, x, y);
    this._scene = scene;

    this.setGravityY(-300);
  }

  set vx(value: number) {
    if (value === this._vx) {
      return
    }
    
    this._vx = value;
    this.setVelocityX(-this._scene.getPlayer().speed + value);
  }

  get vx(): number {
    return this._vx;
  }

  set vy(value: number) {
    this._vy = value;
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
}