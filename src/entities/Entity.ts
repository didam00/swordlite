import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';
import { StatusEffect } from '../types';

export interface EntityState {
  [key: string]: boolean
}

export default abstract class Entity extends Phaser.Physics.Arcade.Sprite {
  abstract entityName: string;
  protected currentDisplayState: string = '';
  events: Phaser.Events.EventEmitter = new Phaser.Events.EventEmitter();
  private states: EntityState = {};
  private blinkTween?: Phaser.Tweens.Tween = null!;
  readonly scene: GameScene = null!;
  isDead: boolean = false;
  isDestroyed: boolean = false;
  delayEvents: Phaser.Time.TimerEvent[] = [];
  playingSounds: Phaser.Sound.BaseSound[] = [];

  statusEffects: StatusEffect[] = [];
  
  // 화면 밖을 나가면 사라지는 옵션
  destroyOnScreenOut: boolean = true;

  static loadedAnimation: string[] = [];
  
  readonly isFollowCamera: boolean = false;

  abstract stats: {
    health: number,
    damage: number,
    [key: string]: number
  };

  constructor(states: string[], scene: GameScene, x: number, y: number) {
    super(scene, x, y, "atlas", `test_idle-0`);
    this.scene = scene;
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
    if (Entity.loadedAnimation.includes(key)) {
      return;
    } else {
      Entity.loadedAnimation.push(key);
    }

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

  addOnlyState(state: string): void {
    for (const key in this.states) {
      if (key === "idle") continue;
      this.states[key] = false;
    }
    this.states[state] = true;
    this.updateAnimation();
  }

  removeAllStates(): void {
    for (const key in this.states) {
      if (key === "idle") continue;
      this.states[key] = false;
    }
    this.updateAnimation();
  }

  getStates(): string[] {
    return Object.keys(this.states).filter(state => this.states[state]);
  }

  getAllStates(): EntityState {
    return this.states;
  }

  getAllStateKeys(): string[] {
    return Object.keys(this.states);
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
    if (!this) {
      return;
    }

    const state = this.getHightestPriorityState();

    if (this.currentDisplayState === state) {
      return;
    }

    this.currentDisplayState = state;
    this.anims?.play(`${this.entityName}_${state}`, true);
  }

  abstract update(delta: number): void;

  blink(duration: number = 500, count?: number, minAlpha: number = 0): void {
    if (this.blinkTween) {
      this.blinkTween.stop();
    }

    count = count ?? duration / 250;
    
    // 트윈 생성하여 저장
    this.blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: minAlpha },
      duration: duration / (count * 2), // 한 번 깜빡이는데 필요한 시간
      yoyo: true,     // 알파값을 왔다갔다 하도록 설정
      repeat: count * 2 - 1, // 한 사이클은 알파값 변화 2번이므로 (count * 2 - 1)
      onComplete: () => {
        this.setAlpha(1); // 트윈 완료 후 알파값 원상복구
        this.blinkTween = undefined;
      }
    });
  }

  stopBlink(): void {
    if (this.blinkTween) {
      this.blinkTween.stop();
      this.blinkTween = undefined;
    }
    this.setAlpha(1);
  }

  onDead(): void {
    
  }

  remove(): void {
    this.delayEvents.forEach(event => {
      event.remove(false);
      event.destroy();
    });
    this.delayEvents = [];
    this.playingSounds.forEach(sound => {
      sound.destroy();
    });
    this.playingSounds = [];

    this.stopBlink();
    this.isDestroyed = true;

    this.scene.time.delayedCall(1000, () => {
      this.destroy();
    });
  }

  playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | undefined {
    const sound = this.scene.playSound(key, config);
    if (!sound) return;
    this.playingSounds.push(sound);

    return sound;
  }

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

  set damage(value: number) {
    this.stats.damage = value;
  }

  get damage(): number {
    return this.stats.damage;
  }

  getDist(other: Entity): number {
    const centerDist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
    
    const thisRadius = Math.max(this.body!.width, this.body!.height) / 2;
    const otherRadius = Math.max(other.body!.width, other.body!.height) / 2;
    
    return Math.max(0, centerDist - (thisRadius + otherRadius));
  }

  getAngle(other: Entity): number {
    return Phaser.Math.Angle.Between(this.x, this.y, other.x, other.y);
  }

  delayedCall(delay: number, callback: () => void): Phaser.Time.TimerEvent {
    const event = this.scene.time.delayedCall(delay, callback, [], this);
    this.delayEvents.push(event);
    return event;
  }

  addStatusEffect(id: string, duration: number) {
    this.statusEffects.push({
      id, duration
    });
  }

  hasStatusEffect(id: string): boolean {
    return this.statusEffects.some(effect => effect.id === id);
  }

  getStatusEffect(id: string): StatusEffect | undefined {
    return this.statusEffects.find(effect => effect.id === id);
  }

  removeStatusEffect(id: string): void {
    this.statusEffects = this.statusEffects.filter(effect => effect.id !== id);
  }
}