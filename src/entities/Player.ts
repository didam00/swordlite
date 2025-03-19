import Phaser from 'phaser';

// 상태와 우선순위를 함께 관리하기 위한 열거형
enum PlayerState {
  IDLE = 0,
  FALL = 1,
  JUMP = 2,
}

class Player extends Phaser.Physics.Arcade.Sprite {
  private states = new Set<PlayerState>();
  private currentDisplayState: PlayerState = PlayerState.IDLE;
  private jumpVelocity: number = -200;
  private events: Phaser.Events.EventEmitter;
  private lastJumpTime: number = 0;
  private jumpCooldown: number = 200; // 100ms
  
  // 플레이어 스탯 추가
  private _stats: {
    range: number;  // 공격 범위 (검과의 거리)
  } = {
    range: 20       // 기본값
  };
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'atlas', 'player_idle-0');
    
    // 이벤트 이미터 초기화
    this.events = new Phaser.Events.EventEmitter();

    this.initPhysics();
    this.body?.setSize(6, 9)
    
    this.createAnimations();
    
    this.addState(PlayerState.IDLE);
    this.updateAnimation();
  }

  private initPhysics(): void {
    this.scene.physics.world.enable(this);
    
    this.setGravityY(300);  // 중력 설정
    this.setBounce(0);      // 바운스 없음
  }

  private createAnimations(): void {
    const scene = this.scene;
    
    if (!scene.anims.exists('player_idle')) {
      scene.anims.create({
        key: 'player_idle',
        frames: scene.anims.generateFrameNames('atlas', {
          prefix: 'player_idle-',
          start: 0,
          end: 0
        }),
        frameRate: 20,
        repeat: -1
      });
    }
    
    if (!scene.anims.exists('player_jump')) {
      scene.anims.create({
        key: 'player_jump',
        frames: [{ key: 'atlas', frame: 'player_jump-0' }],
        frameRate: 12,
        repeat: 0
      });
    }
    
    if (!scene.anims.exists('player_fall')) {
      scene.anims.create({
        key: 'player_fall',
        frames: scene.anims.generateFrameNames('atlas', {
          prefix: 'player_fall-',
          start: 0,
          end: 1
        }),
        frameRate: 20,
        repeat: 0
      });
    }
  }
  
  addState(state: PlayerState): void {
    this.states.add(state);
    this.updateAnimation();
  }
  
  removeState(state: PlayerState): void {
    this.states.delete(state);
    this.updateAnimation();
  }
  
  hasState(state: PlayerState): boolean {
    return this.states.has(state);
  }
  
  // 현재 가장 높은 우선순위의 상태를 반환
  private getHighestPriorityState(): PlayerState {
    if (this.states.size === 0) {
      return PlayerState.IDLE;
    }
    
    return Math.max(...Array.from(this.states)) as PlayerState;
  }
  
  private updateAnimation(): void {
    const highestState = this.getHighestPriorityState();
    
    // 이미 같은 상태의 애니메이션을 재생 중이면 무시
    if (this.currentDisplayState === highestState) {
      return;
    }
    
    this.currentDisplayState = highestState;
    
    switch (highestState) {
      case PlayerState.IDLE:
        this.play('player_idle');
        break;
      case PlayerState.JUMP:
        this.play('player_jump');
        break;
      case PlayerState.FALL:
        this.play('player_fall');
        break;
    }
  }
  
  jump(): void {
    const currentTime = this.scene.time.now;
    
    if (currentTime - this.lastJumpTime < this.jumpCooldown) {
      return;
    }
    
    this.lastJumpTime = currentTime;
    
    this.setVelocityY(this.jumpVelocity);
    
    this.removeState(PlayerState.FALL);
    this.addState(PlayerState.JUMP);
    
    this.events.emit('jump', {
      x: this.x,
      y: this.y - 4,
      isPlayerJumping: true
    });
  }

  onJump(callback: Function, context?: any): this {
    this.events.on('jump', callback, context);
    return this;
  }
  
  update(delta: number): void {
    // 상태 업데이트
    if ((this.body as Phaser.Physics.Arcade.Body).velocity.y < 0) {
      this.removeState(PlayerState.FALL);
      this.addState(PlayerState.JUMP);
    } else if ((this.body as Phaser.Physics.Arcade.Body).velocity.y > 0) {
      this.removeState(PlayerState.JUMP);
      this.addState(PlayerState.FALL);
    } else if ((this.body as Phaser.Physics.Arcade.Body).blocked.down) {
      this.removeState(PlayerState.JUMP);
      this.removeState(PlayerState.FALL);
      this.addState(PlayerState.IDLE);
    }
  }
  
  getDebugStateInfo(): string {
    const stateInfo = `State: ${["IDLE", "FALL", "JUMP"][this.currentDisplayState]}`;
    const velocityInfo = `VelocityY: ${Math.round((this.body as Phaser.Physics.Arcade.Body).velocity.y)}`;
    const groundInfo = `OnGround: ${(this.body as Phaser.Physics.Arcade.Body).blocked.down}`;
    
    return `${stateInfo}\n${velocityInfo}\n${groundInfo}`;
  }

  // 점프 쿨타임 설정 메서드
  setJumpCooldown(cooldown: number): this {
    this.jumpCooldown = cooldown;
    return this;
  }
  
  // 스탯 접근자 추가
  get stats(): { range: number } {
    return this._stats;
  }
  
  // 개별 스탯 설정 메서드
  setRange(range: number): this {
    this._stats.range = range;
    return this;
  }
}

export default Player;
export { PlayerState };
