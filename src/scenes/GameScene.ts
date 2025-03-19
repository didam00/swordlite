import Phaser from 'phaser';
import Player from '../entities/Player';
import Sword from '../entities/Sword';

class GameScene extends Phaser.Scene {
  private layers: {
    [key: string]: Phaser.GameObjects.Container
  } = {
    background: null!,
    effect: null!,
    item: null!,
    entity: null!,
    weapon: null!,
    player: null!,
    ui: null!,
  };
  
  private player: Player = null!;
  private sword: Sword = null!;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('GameScene')
  }

  create() {
    this.initLayers();
    this.cameras.main.setBackgroundColor('#66334b');
    
    // 물리 엔진 세계의 경계 설정
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    // 플레이어 생성 및 초기화
    this.createPlayer();
    
    // 검 생성
    this.createSword();
    
    // 키보드 입력 설정
    if (this.input.keyboard != null) {
      this.cursors = this.input.keyboard.createCursorKeys();
    } else {
      console.error('키보드 입력을 사용할 수 없습니다.');
    }
  }
  
  initLayers(): void {
    for (const key in this.layers) {
      this.layers[key] = this.add.container(0, 0);
    }
  }
  
  // 플레이어 생성 메서드 수정
  createPlayer(): void {
    // Player 클래스 인스턴스 생성
    this.player = new Player(
      this, 
      40,
      this.cameras.main.height / 2
    );
    
    // 플레이어에 물리 엔진 적용
    this.physics.add.existing(this.player);
    
    // 플레이어 스탯 설정 - 예: range 값을 30으로 설정
    this.player.setRange(20);
    
    // 플레이어를 player 레이어에 추가
    if (this.layers.player) {
      this.layers.player.add(this.player);
    }

    this.player.onJump(this.createJumpEffect, this);
    
    // 플레이어가 물리 세계 경계와 충돌하도록 설정
    this.player.setCollideWorldBounds(true);
  }

  // 검 생성 메서드 수정
  createSword(): void {
    // Sword 클래스 인스턴스 생성 - effect 레이어 전달
    this.sword = new Sword(
      this, 
      this.player, 
      this.layers.effect
    );
    
    // 검 공격 쿨타임 설정
    this.sword.setAttackCooldown(200);
    
    // 검을 weapon 레이어에 추가
    if (this.layers.weapon) {
      this.layers.weapon.add(this.sword);
    }
    
    // 검 생성 후 씬에 추가
    this.add.existing(this.sword);
  }

  createJumpEffect(data: { x: number, y: number }): void {
    const jumpEffect = this.add.sprite(data.x, data.y, 'atlas', 'jump_effect-0');
    this.layers.effect.add(jumpEffect);
    
    if (!this.anims.exists('jump_effect')) {
      this.anims.create({
        key: 'jump_effect',
        frames: this.anims.generateFrameNames('atlas', {
          prefix: 'jump_effect-',
          start: 0,
          end: 4
        }),
        frameRate: 20,
        repeat: 0
      });
    }
    
    // 이펙트를 particle 레이어에 추가
    if (this.layers.particle) {
      this.layers.particle.add(jumpEffect);
    }
    
    // 애니메이션 재생 및 완료 시 제거
    jumpEffect.play('jump_effect');
    jumpEffect.on('animationcomplete', () => {
      jumpEffect.destroy();
    });
  }
  
  update(time: number, delta: number): void {
    if (this.player) {
      this.player.update(delta);
      
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        this.player.jump();
      }
    }
    
    // 검 업데이트
    if (this.sword) {
      this.sword.update();
    }
  }
}

export default GameScene;