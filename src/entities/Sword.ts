import Phaser from 'phaser';
import Player from './Player';

class Sword extends Phaser.GameObjects.Sprite {
  private owner: Player;  // Player 타입으로 변경
  private offset: number = 24;
  private angleOffset: number = 0;
  private currentAngleIndex: number = 0;
  
  // 공격 이펙트 관련 속성
  private attackEffect: Phaser.GameObjects.Sprite | null = null;
  private isAttacking: boolean = false;
  private lastAttackTime: number = 0;
  private attackCooldown: number = 200;
  
  // 이펙트 레이어 참조 추가
  private effectLayer: Phaser.GameObjects.Container | null = null;
  
  // 현재 마우스 위치 추적을 위한 변수 추가
  private lastMousePosition: {x: number, y: number} = {x: 0, y: 0};
  
  constructor(scene: Phaser.Scene, owner: Player, effectLayer: Phaser.GameObjects.Container) {
    super(scene, owner.x, owner.y, 'atlas', 'sword-0');
    
    this.owner = owner;
    this.effectLayer = effectLayer;
    this.offset = owner.stats.range;  // 초기 offset을 플레이어의 range로 설정
    
    this.setOrigin(0.5, 0.5);
    
    this.scene.input.on('pointermove', this.onMouseMove, this);
    
    // 점프 이벤트 리스닝
    if ('onJump' in this.owner && typeof this.owner.onJump === 'function') {
      this.owner.onJump(this.onPlayerJump, this);
    }
    
    // 초기 마우스 위치 설정
    if (this.scene.input.activePointer) {
      this.lastMousePosition.x = this.scene.input.activePointer.x;
      this.lastMousePosition.y = this.scene.input.activePointer.y;
    }
    
    // 공격 효과 애니메이션 생성
    this.createAttackEffectAnimations();
  }
  
  // 공격 이펙트용 애니메이션 생성
  private createAttackEffectAnimations(): void {
    if (!this.scene.anims.exists('attack_effect')) {
      const attack_effect = this.scene.anims.create({
        key: 'attack_effect',
        frames: this.scene.anims.generateFrameNames('effects', {
          prefix: 'attack-',
          start: 0,
          end: 4,  // 프레임 범위는 실제 이미지에 맞게 조정
          zeroPad: 1
        }),
        frameRate: 1000 / Math.max(100, this.owner.jumpCoolDown) * 6,
        repeat: 0
      });
    }
  }

  
  // 플레이어 점프 시 호출되는 메서드
  onPlayerJump(data: { x: number, y: number }): void {
    const currentTime = this.scene.time.now;
    
    // 공격 쿨타임 체크
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return;
    }
    
    this.lastAttackTime = currentTime;
    
    // 공격 방향 계산 (마우스 위치)
    const pointer = this.scene.input.activePointer;
    const dx = pointer.x - this.owner.x;
    const dy = pointer.y - this.owner.y;
    const angle = Math.atan2(dy, dx);
    
    // 검을 잠시 숨기기
    this.setVisible(false);
    
    // 공격 이펙트 시작 - 플레이어 위치 기준
    this.startAttackEffect(angle, this.owner.x, this.owner.y);
  }
  
  // 공격 이펙트 시작 - 크기를 range와 연동
  startAttackEffect(angle: number, x: number, y: number): void {
    // 이미 공격 중이면 이전 이펙트 제거
    if (this.attackEffect) {
      this.attackEffect.destroy();
    }
    
    // 공격 진행 중 상태로 설정
    this.isAttacking = true;
    
    // 공격 방향에 따른 각도 계산 (도)
    const degrees = Phaser.Math.RadToDeg(angle);
    
    // 공격 이펙트 생성 - 플레이어 위치에 생성
    this.attackEffect = this.scene.add.sprite(
      x,  // 플레이어의 x 위치
      y,  // 플레이어의 y 위치
      'effects',
      'attack-0'
    );
    
    // 이펙트 위치와 회전 설정
    this.attackEffect.setOrigin(0.5, 0.5);
    this.attackEffect.setRotation(angle - 45);
    
    // range 값에 따라 공격 이펙트의 크기 조정
    // 기준 범위(24)를 100% 크기로 설정하고, range에 따라 비례하여 조정
    const scaleMultiplier = this.owner.stats.range / 40;
    this.attackEffect.setScale(scaleMultiplier);
    
    // 이펙트를 effect 레이어에 추가
    if (this.effectLayer) {
      this.effectLayer.add(this.attackEffect);
    }

    this.owner.addState("attack");
    this.attackEffect.play('attack_effect');
    
    // 애니메이션 완료 시 이펙트 제거 및 검 표시
    this.attackEffect.on('animationcomplete', () => {
      if (this.attackEffect) {
        this.attackEffect.destroy();
        this.attackEffect = null;
      }
      this.isAttacking = false;
      this.owner.removeState("attack");
      
      // 검을 다시 보이게 하기
      this.setVisible(true);
    });
  }
  
  onMouseMove(pointer: Phaser.Input.Pointer): void {
    // 마우스 위치 업데이트
    this.lastMousePosition.x = pointer.x;
    this.lastMousePosition.y = pointer.y;
    
    // 검 방향과 위치 업데이트
    this.updateSwordDirection();
  }
  
  // 검 방향과 위치 업데이트 메서드 (분리하여 재사용 가능하게)
  updateSwordDirection(): void {
    const dx = this.lastMousePosition.x - this.owner.x;
    const dy = this.lastMousePosition.y - this.owner.y;
    
    const angle = Math.atan2(dy, dx);
    
    const degrees = Phaser.Math.RadToDeg(angle);
    const normalizedDegrees = (degrees + 360) % 360;
    
    // 45도 간격
    const angleIndex = Math.floor(((normalizedDegrees + 90 + 22.5) % 360) / 45);
    
    // 각도 인덱스에 따라 이미지 프레임 변경
    this.updateSwordImage(angleIndex);
    // this.rotation = angle + Math.PI / 2;
    
    // 검의 위치 업데이트
    this.updateSwordPosition(angle);
  }
  
  updateSwordImage(angleIndex: number): void {
    // 방향 계산 결과가 유효한 범위인지 확인
    if (angleIndex < 0 || angleIndex > 7) {
      console.warn(`Invalid angleIndex: ${angleIndex}, correcting to range 0-7`);
      angleIndex = Math.abs(angleIndex % 8);
    }
    
    // 이미지가 이미 같은 각도를 나타내고 있다면 업데이트 스킵
    if (this.currentAngleIndex === angleIndex) {
      return;
    }
    
    this.currentAngleIndex = angleIndex;
    
    // sword-0 ~ sword-7 사이의 프레임으로 설정
    this.setFrame(`sword-${angleIndex}`);
  }
  
  updateSwordPosition(angle: number): void {
    // 현재 플레이어 range 값으로 offset 업데이트
    this.offset = this.owner.stats.range;
    
    // 플레이어 주변에 검 위치 설정
    const x = this.owner.x + Math.cos(angle) * this.offset;
    const y = this.owner.y + Math.sin(angle) * this.offset;
    
    this.setPosition(x, y);
  }
  
  update(): void {
    // 공격 중이면 이펙트 위치를 플레이어 위치로 계속 업데이트
    if (this.isAttacking && this.attackEffect) {
      this.attackEffect.setPosition(this.owner.x, this.owner.y);
    }
    
    // 매 프레임마다 검 방향과 위치 업데이트 (마우스가 움직이지 않더라도)
    if (!this.isAttacking) {
      this.updateSwordDirection();
    }
  }
  
  // 검의 오프셋 거리 설정
  setOffset(offset: number): this {
    this.offset = offset;
    return this;
  }
  
  // 공격 쿨타임 설정
  setAttackCooldown(cooldown: number): this {
    this.attackCooldown = cooldown;
    return this;
  }
}

export default Sword;
