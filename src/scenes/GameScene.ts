import Phaser from 'phaser';
import Player from '../entities/Player';
import Sword from '../entities/Sword';
import Mushroom from '../entities/Mushroom';
import Entity from '../entities/Entity';
import Enemy from '../entities/Enemy';

class GameScene extends Phaser.Scene {
  private layers: {
    [key: string]: Phaser.GameObjects.Container
  } = {
    background: null!,
    item: null!,
    entity: null!,
    weapon: null!,
    player: null!,
    effect: null!,
    ui: null!,
  };
  
  private player: Player = null!;
  private obstacles: Entity[] = [];
  private enemies: Enemy[] = [];

  private sword: Sword = null!;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private isGameOver: boolean = false;
  private meter: number = 0;

  constructor() {
    super('GameScene')
  }

  create() {
    this.initLayers();
    this.cameras.main.setBackgroundColor('#66334b');
    
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    this.createPlayer();
    this.createSword();
    this.createEnemies();
    
    // 키보드 입력 설정
    if (this.input.keyboard != null) {
      this.cursors = this.input.keyboard.createCursorKeys();
    } else {
      console.error('키보드 입력을 사용할 수 없습니다.');
    }

    this.startGame();
  }

  createEnemies(): void {
    // 적 그룹 생성
    this.enemies = [];
    
    // 플레이어와 적 충돌 설정
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision,
      undefined,
      this
    );
  }
  
  spawnEnemy(): void {
    if (this.isGameOver) return;
    
    const enemy = new Mushroom(
      this,
      this.cameras.main.width + 20,
      Phaser.Math.Between(30, this.cameras.main.height - 30)
    );
    
    this.enemies.push(enemy);
    this.layers.entity.add(enemy);
    this.physics.add.existing(enemy);
    
    console.log(`적 생성: ${this.enemies.length}`);
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
      48,
      this.cameras.main.height / 2
    );
    
    if (this.layers.player) {
      this.layers.player.add(this.player);
    }

    this.player.onJump(this.createJumpEffect, this);
    this.player.setCollideWorldBounds(true);
  }

  createSword(): void {
    this.sword = new Sword(
      this, 
      this.player, 
      this.layers.effect
    );
    
    this.sword.setAttackCooldown(this.player.jumpCoolDown);
    
    if (this.layers.weapon) {
      this.layers.weapon.add(this.sword);
    }
    
    // 검 생성 후 씬에 추가
    this.add.existing(this.sword);
  }

  createJumpEffect(data: { x: number, y: number }): void {
    const jumpEffect = this.add.sprite(data.x, data.y - 4, 'atlas', 'jump_effect-0');
    this.layers.effect.add(jumpEffect);
    
    if (!this.anims.exists('jump_effect')) {
      this.anims.create({
        key: 'jump_effect',
        frames: this.anims.generateFrameNames('atlas', {
          prefix: 'jump_effect-',
          start: 0,
          end: 4
        }),
        frameRate: 24,
        repeat: 0
      });
    }
    
    jumpEffect.setScale((this.player.jumpPower / 300) + 0.5);

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

  startGame() {
    this.meter = 0;
    this.isGameOver = false;

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callbackScope: this,
      callback: () => {
        this.spawnEnemy();
      }
    });
  }
  
  handlePlayerEnemyCollision(enemy: any): void {
    if (enemy instanceof Enemy && enemy.attack > 0) {
      this.player.takeDamage(enemy.attack);
    }

    console.log("Player take damaged!");
  }
  
  update(time: number, delta: number): void {
    if (this.player) {
      this.player.update(delta);
      this.meter += delta * this.player.speed / 1000;
      
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        this.player.jump();
      }
    }
    
    if (this.sword) {
      this.sword.update();
    }

    for (const enemy of this.enemies) {
      enemy.update(delta);
      if (
        (enemy.x < -30) || (enemy.y < -30)
        || (enemy.y > this.cameras.main.height + 30)
        || (enemy.health <= 0)
      ) {
        enemy.destroy();
        this.enemies = this.enemies.filter(e => e !== enemy);
      }
    }
  }

  getPlayer(): Player {
    return this.player;
  }
}

export default GameScene;