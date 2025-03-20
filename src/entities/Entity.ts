import Phaser from 'phaser';

export interface EntityState {
  [key: string]: boolean
}

export default abstract class Entity extends Phaser.Physics.Arcade.Sprite {
  abstract entityName: string;
  protected currentDisplayState: string = '';
  protected events: Phaser.Events.EventEmitter = new Phaser.Events.EventEmitter();
  private states: EntityState = {};

  abstract stats: {
    health: number,
    attack: number,
    [key: string]: number
  };

  constructor(states: string[], scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "atlas", `test_idle-0`);
    this.createStates(states);
    
    this.scene.physics.world.enable(this);
  }

  abstract createAnimations(): void;

  private createStates(states: string[]): void {
    states.forEach(state => {
      this.states[state] = false;
    });
  }

  createAnimation(key: string, atlasFrameName?: string): void;
  createAnimation(key: string, atlasFrameNamePrefix: string, range: [number, number], frameRate?: number, repeat?: number): void;
  createAnimation(key: string, atlasFrameNameOrPrefix?: string | [number, number], rangeOrFrameRate?: number | [number, number], frameRateOrRepeat?: number, repeat?: number): void;

  createAnimation(key: string, atlasFrameNameOrPrefix?: string | [number, number], rangeOrFrameRate?: number | [number, number], frameRateOrRepeat?: number, repeatParam?: number): void {
    if (Array.isArray(atlasFrameNameOrPrefix)) {
      const range = atlasFrameNameOrPrefix;
      const frameRate = typeof rangeOrFrameRate === 'number' ? rangeOrFrameRate : 24;
      const repeat = typeof frameRateOrRepeat === 'number' ? frameRateOrRepeat : -1;
      
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: this.scene.anims.generateFrameNames('atlas', {
            prefix: key + "-",
            start: range[0],
            end: range[1]
          }),
          frameRate: frameRate,
          repeat: repeat
        });
      }
      return;
    }
    
    const range = Array.isArray(rangeOrFrameRate) ? rangeOrFrameRate : undefined;
    const frameRate = typeof frameRateOrRepeat === 'number' ? frameRateOrRepeat : 24;
    const repeat = typeof repeatParam === 'number' ? repeatParam : -1;

    if (range === undefined) {
      const atlasFrameName = atlasFrameNameOrPrefix ?? key+"-0";
      
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: [{ key: 'atlas', frame: atlasFrameName }],
        });
      }
    } else {
      const atlasFrameNamePrefix = atlasFrameNameOrPrefix ?? key;
      
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: this.scene.anims.generateFrameNames('atlas', {
            prefix: atlasFrameNamePrefix + "-",
            start: range[0],
            end: range[1]
          }),
          frameRate: frameRate,
          repeat: repeat
        });
      }
    }
    if (range === undefined) {
      const atlasFrameName = atlasFrameNameOrPrefix ?? key+"-0";
      
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: [{ key: 'atlas', frame: atlasFrameName }],
        });
      }
    } else {
      const atlasFrameNamePrefix = atlasFrameNameOrPrefix ?? key;
      
      if (!this.scene.anims.exists(key)) {
        this.scene.anims.create({
          key,
          frames: this.scene.anims.generateFrameNames('atlas', {
            prefix: atlasFrameNamePrefix + "-",
            start: range[0],
            end: range[1]
          }),
          frameRate: frameRate,
          repeat: repeat
        });
      }
    }
  }

  takeDamage(amount: number): void {
    this.stats.health -= amount;
  }

  addState(state: string): void {
    this.states[state] = true;
    this.updateAnimation();
  }

  removeState(state: string): void {
    this.states[state] = false;
    this.updateAnimation();
  }

  hasState(state: string): boolean {
    return Boolean(this.states[state]);
  }

  /** 처음에 states를 override하여 지정할 때, 처음에 올 수록 우선순위가 낮음 */
  getHightestPriorityState(): string {
    for (const state of Object.keys(this.states).reverse()) {
      if (this.states[state]) {
        return state;
      }
    }
    return 'idle';
  }

  updateAnimation(): void {
    const state = this.getHightestPriorityState();

    if (this.currentDisplayState === state) {
      return;
    }

    this.currentDisplayState = state;
    this.anims.play(`${this.entityName}_${state}`, true);
  }

  abstract update(delta: number): void;

  // setStat(key: string, value: number): void {
  //   this.stats[key] = value;
  // }

  // getStat(key: string): number {
  //   return this.stats[key];
  // }

  set health(value: number) {
    this.stats.health = value;
  }

  get health(): number {
    return this.stats.health;
  }

  set attack(value: number) {
    this.stats.attack = value;
  }

  get attack(): number {
    return this.stats.attack;
  }
}