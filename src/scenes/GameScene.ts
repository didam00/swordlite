/** // TODO
 * 1. 더블 킬 등 콤보 시스템 추가 (텍스트로 보여줌)
 * */


import Phaser from 'phaser';
import Player from '../entities/Player';
import Sword from '../entities/Sword';
import PurpleMushroom from '../entities/PurpleMushroom';
import Entity from '../entities/Entity';
import Enemy from '../entities/Enemy';
import RedMushroom from '../entities/RedMushroom';
import BlueMushroom from '../entities/BlueMushroom';
import itemList from '../items/ItemList';
import { createItem } from '../items/Item';
import DreamOfMushroom from '../entities/DreamOfMushroom';
import CRTFilter from '..';
import FakeRedMushroom from '../entities/FakeRedMushroom';

class GameScene extends Phaser.Scene {
  readonly layers: {
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

  private sfxCounts: { [key: string]: number } = {
    jump: 3,
    hit: 4,
    attack: 3,
    shotCharging: 1,
    charging: 2,
    charge: 2,
    rocket$mp3: 1,
    hurt: 1,
    collectItem: 1,
    levelup: 1,
    evade: 1,
    dash: 2,
  };

  debugMode: boolean = false;
  
  player: Player = null!;
  
  private obstacles: Entity[] = [];
  enemyGroup: Phaser.Physics.Arcade.Group = null!;
  enemies: Enemy[] = [];
  private meterText: Phaser.GameObjects.Text = null!;
  
  private swords: Sword[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  
  private isGameOver: boolean = false;
  private meter: number = 0;
  
  spawnCooldown: number = 2000;
  lastSpawnTime: number = 0;
  
  private healthHearts: Phaser.GameObjects.Sprite[] = [];
  private readonly HEART_SPACING: number = 6; // 하트 간격
  private previousHealth: number = 0;
  private previousMaxHealth: number = 0; // 최대 체력 추적용 멤버 변수 명시적 선언
  
  // 디버그 모드 및 공격 범위 표시를 위한 변수 추가
  private attackRangeGraphics: Phaser.GameObjects.Graphics = null!;
  
  // 공격 당 한 번만 타격된 적들을 추적하기 위한 배열
  private hitEnemies: Enemy[] = [];
  
  private bulletGroup: Phaser.Physics.Arcade.Group = null!;
  private background: Phaser.GameObjects.TileSprite = null!;
  private bgMusic: Phaser.Sound.BaseSound = null!;

  private expBar: Phaser.GameObjects.Graphics = null!;
  private levelText: Phaser.GameObjects.Text = null!;

  private itemListContainer: Phaser.GameObjects.Container = null!;

  private clearBoss: number = 0;
  bossIsDead: boolean = true;
  
  constructor() {
    super('GameScene')
  }

  preload() {
    for (let sfxType in this.sfxCounts) {
      let ext = 'wav';
      if (sfxType.indexOf('$') !== -1) {
        let o = sfxType;
        ext = sfxType.split("$")[1];
        sfxType = sfxType.split("$")[0];
        this.sfxCounts[sfxType] = this.sfxCounts[o];
      }

      for (let i = 1; i <= this.sfxCounts[sfxType]; i++) {
        this.load.audio(`${sfxType}-${i}`, `assets/sounds/${sfxType}-${i}.${ext}`);
      }
    }
  }

  create() {
    // // 필터
    // const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    // if (!renderer.pipelines.has('CRTFilter')) {
    //   renderer.pipelines.addPostPipeline('CRTFilter', CRTFilter);
    // }
    // this.cameras.main.setPostPipeline('CRTFilter');

    // debug functions
    this.createDebugFunction();

    this.initLayers();
    this.cameras.main.setBackgroundColor('#000000');
    
    // 배경 생성 및 설정
    this.createBackground();

    // 배경 음악 재생 - 에러 처리 추가
    this.playBackgroundMusic();
    
    // 총알 그룹 생성
    this.createBulletGroup();
    
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    this.createPlayer();
    this.createHealthUI();
    this.createSword();
    this.createEnemies();
    
    if (this.input.keyboard != null) {
      this.cursors = this.input.keyboard.createCursorKeys();
    } else {
      console.error('키보드 입력을 사용할 수 없습니다.');
    }

    this.attackRangeGraphics = this.add.graphics();
    this.layers.effect.add(this.attackRangeGraphics);
    
    // 디버그 모드 토글 키 설정 (D 키)
    this.input.keyboard?.addKey('D').on('down', () => {
      this.physics.world.drawDebug = !this.physics.world.drawDebug;
      this.debugMode = !this.debugMode;

      if (this.physics.world.drawDebug) {
        if (!this.physics.world.debugGraphic) {
          this.physics.world.debugGraphic = this.add.graphics().setDepth(999);
        }
        this.physics.world.drawDebug = true;
      } else {
        if (this.physics.world.debugGraphic) {
          this.physics.world.debugGraphic.clear();
        }
        this.physics.world.drawDebug = false;
      }

      const debugText = this.add.text(10, 10, `Debug Mode:${this.physics.world.drawDebug ? ' ON' : 'OFF'}`, {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000',
        fontFamily: 'monospace',
        resolution: 1,
      }).setScrollFactor(0);

      this.time.delayedCall(1500, () => {
        debugText.destroy();
      });
    });

    // 거리 표시
    this.meterText = this.add.text(this.cameras.main.width - 8, 8, '0M', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      resolution: 1,
    })
      .setScrollFactor(0)
      .setOrigin(1, 0);
    this.layers.ui.add(this.meterText);

    // 경험치 표시
    this.levelText = this.add.text(this.cameras.main.width - 8, 24, '', {
      fontFamily: 'monospace',
      fontSize: '9pt',
      color: '#ffffff',
      resolution: 1,
    }).setScrollFactor(0).setOrigin(0.5, 0);
    this.expBar = this.add.graphics();
    this.updateExpBar();
    
    this.layers.ui.add(this.levelText);
    this.layers.ui.add(this.expBar);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.player.hasItem("black_coffee") && pointer.rightButtonDown()) {
        this.player.dash();
      }
    });

    this.itemListContainer = this.add.container(this.cameras.main.width - 14, 32);
    this.itemListContainer.setScrollFactor(0);
    this.layers.ui.add(this.itemListContainer);

    this.startGame();
  }

  createEnemies(): void {
    this.enemyGroup = this.physics.add.group({
      // runChildUpdate: true
    });
    
    this.physics.add.overlap(
      this.enemyGroup,
      this.player,
      this.checkEnemyHits,
      undefined,
      this
    );
  }
  
  spawnEnemy(id: string | null = null, level?: number): Enemy | null {
    if (this.isGameOver) return null;

    let enemy: Enemy = null!;
    level = level || Math.floor(this.meter / 10000 + 1);

    if (!id) {
      id = Phaser.Utils.Array.GetRandom([
        'purple_mushroom',
        'blue_mushroom',
        'red_mushroom',
      ]);
    }

    if (id !== null) {
      switch (id) {
        case 'purple_mushroom':
          enemy = new PurpleMushroom(
            this,
            this.cameras.main.width + 20,
            Phaser.Math.Between(10, this.cameras.main.height - 10)
          );
          break;
        case 'blue_mushroom':
          enemy = new BlueMushroom(
            this,
            this.cameras.main.width + 20,
            Phaser.Math.Between(10, this.cameras.main.height - 10)
          );
          break;
        case 'dream_of_mushroom':
          enemy = new DreamOfMushroom(
            this,
            this.cameras.main.width + 20,
            this.cameras.main.height / 2
          );
          break;
        case 'red_mushroom':
          enemy = new RedMushroom(
            this,
            this.cameras.main.width + 20,
            Phaser.Math.Between(10, this.cameras.main.height - 10)
          );
          break;
        case 'fake_red_mushroom':
          enemy = new FakeRedMushroom(
            this,
            this.cameras.main.width + 20,
            Phaser.Math.Between(10, this.cameras.main.height - 10)
          );
          break;

        default:
          enemy = new DreamOfMushroom(
            this,
            this.cameras.main.width + 20,
            this.cameras.main.height / 2
          );
          break;
        }
    }

    this.enemies.push(enemy);
    this.layers.entity.add(enemy);
    this.enemyGroup.add(enemy);
    
    enemy.velocity = {x: 0, y: 0};
    enemy.health = enemy.stats.health * level;
    enemy.level = level;

    return enemy;
  }

  spawnItem(rarity: string): void {
    // 무작위 기본 아이템 생성
    const normalItems = itemList.filter(item => item.rarity === rarity);
    const randomItem = normalItems[Math.floor(Math.random() * normalItems.length)];

    const item = createItem(
      randomItem.id,
      this.cameras.main.width + 16 + Math.random() * 16,
      this.player.y - 16 + Math.random() * 32,
      this
    );

    // item?.setTint(0xb991f2);

    if (item) {
      this.physics.world.enable(item);

      item.setOrigin(0.5, 0.5);
      item.setSize(2, 2);
      item.setVelocityX(-this.player.speed + 30);

      this.physics.add.overlap(
        this.player,
        item,
        () => {
          this.player.collectItem(item);
          // collect_item effect animation
          
        },
        undefined,
        this
      )

      this.layers.item.add(item);
    }
  }
  
  initLayers(): void {
    for (const key in this.layers) {
      this.layers[key] = this.add.container(0, 0);
    }
  }
  
  createPlayer(): void {
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

    this.player.events.on('healthChanged', this.updateHealthUI, this);
    this.player.events.on('levelUp', () => {
      let rarity: string = "common";
      if (this.player.level % 10 === 5) {
        rarity = "epic";
      }
      this.spawnItem(rarity);
    });
    this.player.events.on('speedChanged', this.playerSpeedUpdated, this);
    this.player.events.on('itemCollected', this.updateItemList, this);
  }

  createSword(): void {
    const sword = new Sword(
      this, 
      this.player, 
      this.layers.effect,
      this.swords.length
    );

    this.swords.push(sword);
    
    if (this.layers.weapon) {
      this.layers.weapon.add(sword);
    }

    // this.sword.setDepth(999);
    
    this.add.existing(sword);
  }

  createJumpEffect(data: { x: number, y: number }): void {
    const jumpEffect = this.add.sprite(data.x, data.y + 4, 'effects', 'jump-0');
    this.layers.effect.add(jumpEffect);
    
    if (!this.anims.exists('jump')) {
      this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNames('effects', {
          prefix: 'jump-',
          start: 0,
          end: 4
        }),
        frameRate: 24,
        repeat: 0
      });
    }
    
    // jumpEffect.setScale((this.player.jumpPower / 300) + 0.5);

    if (this.layers.particle) {
      this.layers.particle.add(jumpEffect);
    }

    jumpEffect.play('jump');
    jumpEffect.on('animationcomplete', () => {
      jumpEffect.destroy();
    });
  }

  createHealthUI(): void {
    const left = 12;
    const top = 8;
    
    // 기존 하트 삭제
    this.healthHearts.forEach(heart => heart.destroy());
    this.healthHearts = [];
    
    // 테두리만 먼저 생성
    for (let i = 0; i < this.player.stats.maxHealth; i++) {
      const outline = this.add.sprite(
        left + i * this.HEART_SPACING,
        top,
        'ui',
        'heart-outline'
      );
      
      outline.setScrollFactor(0)
             .setScale(1)
             .setOrigin(0, 0)
             .setDepth(9998)
             .setVisible(true)
             .setAlpha(1);
      
      this.layers.ui.add(outline);
    }

    // 하트 생성
    for (let i = 0; i < this.player.stats.maxHealth; i++) {
      // 하트 텍스처 확인
      let fullHeartFrame = 'heart-full';
      let emptyHeartFrame = 'heart-empty';
      
      // 텍스처 확인
      const frames = this.textures.get('ui').getFrameNames();
      if (frames.includes('heartfull')) {
        fullHeartFrame = 'heartfull';
        emptyHeartFrame = 'heartempty';
      } else if (frames.includes('heart_full')) {
        fullHeartFrame = 'heart_full';
        emptyHeartFrame = 'heart_empty';
      }
      
      // 하트 생성
      const heart = this.add.sprite(
        left + i * this.HEART_SPACING,
        top,
        'ui',
        i < this.player.health ? fullHeartFrame : emptyHeartFrame
      );
      
      // 명시적으로 모든 속성 설정
      heart.setScrollFactor(0)
           .setScale(1)
           .setOrigin(0, 0)
           .setDepth(9999)
           .setAlpha(1)
           .setVisible(true);
      
      // 디버깅용 테두리 추가 (보이는지 확인용)
      heart.setTint(0xffffff);
      
      this.healthHearts.push(heart);
      this.layers.ui.add(heart);
    }
    
    this.updateHealthUI();
  }

  updateHealthUI(): void {
    if (!this.player) return;
    
    const currentHealth = this.player.health;
    const maxHealth = this.player.stats.maxHealth;
    
    // 이전 체력과 최대 체력 값
    const previousHealth = this.previousHealth !== undefined ? this.previousHealth : currentHealth;
    const previousMaxHealth = this.previousMaxHealth !== undefined ? this.previousMaxHealth : this.healthHearts.length;
    
    // 변경사항 감지
    const damageReceived = previousHealth > currentHealth;
    const healthRecovered = previousHealth < currentHealth;
    const maxHealthIncreased = maxHealth > previousMaxHealth;
    
    // 현재 값 저장
    this.previousHealth = currentHealth;
    this.previousMaxHealth = maxHealth;
    
    // 텍스처 프레임 확인
    let fullHeartFrame = 'heart-full';
    let emptyHeartFrame = 'heart-empty';
    
    // 텍스처 확인
    const frames = this.textures.get('ui').getFrameNames();
    if (frames.includes('heartfull')) {
      fullHeartFrame = 'heartfull';
      emptyHeartFrame = 'heartempty';
    } else if (frames.includes('heart_full')) {
      fullHeartFrame = 'heart_full';
      emptyHeartFrame = 'heart_empty';
    }
    
    // 최대 체력이 증가한 경우 하트 UI 재생성
    if (maxHealthIncreased) {
      this.createHealthUI(); // 하트 UI를 완전히 새로 생성
      return;
    }
    
    // 기존 하트들의 상태 업데이트
    this.healthHearts.forEach((heart, index) => {
      // 모든 하트가 보이게 설정
      heart.setVisible(true);
      heart.setAlpha(1);
      
      if (index < currentHealth) {
        // 체력 회복 효과
        if (healthRecovered && index >= previousHealth && index < currentHealth) {
          heart.setTexture('ui', fullHeartFrame);
          this.tweens.add({
            targets: heart,
            scaleX: { from: 1.5, to: 1 },
            scaleY: { from: 1.5, to: 1 },
            alpha: { from: 0.6, to: 1 },
            duration: 250,
            ease: 'Back.easeOut',
            onStart: () => {
              heart.setTint(0x8cff9b); // 녹색 틴트 효과
            },
            onComplete: () => {
              heart.clearTint(); // 틴트 제거
            }
          });
        } else {
          heart.setTexture('ui', fullHeartFrame);
        }
      } else {
        heart.setTexture('ui', emptyHeartFrame);
        // 체력 감소 효과
        if (damageReceived && index >= currentHealth && index < previousHealth) {
          this.tweens.add({
            targets: heart,
            value: { from: 0, to: 100 },
            duration: 125,
            yoyo: false,
            repeat: 1,
            onUpdate: (tween) => {
              if (!heart) {
                tween.stop();
                return;
              }

              try {
                const progress = tween.getValue();
                if ((progress > 25 && progress < 50) || (progress > 75 && progress < 100)) {
                  heart.setTexture('ui', fullHeartFrame); 
                } else {
                  heart.setTexture('ui', emptyHeartFrame);
                }
              } catch {
                console.error('Heart tween error');
              }
            },
            onComplete: () => {
              heart.setTexture('ui', emptyHeartFrame);
            }
          });
        }
      }
    });
  }

  updateItemList(): void {
    let i = 0;
    this.itemListContainer.removeAll(true);
    for (const item of Object.keys(this.player.items)) {
      const itemData = itemList.find(i => i.id === item)!;

      if (!itemData.displayOnList) continue;

      const itemSprite = this.add.sprite(0, i * 14, 'items', `${item}-0`);
      itemSprite.setOrigin(0.5, 0.5).setAlpha(0.5);
      this.itemListContainer.add(itemSprite);

      if (this.player.items[item] > 1) {
        const countText = this.add.bitmapText(4, i * 14 + 2, 'mini', `${this.player.items[item]}`);
        countText.setOrigin(0.5, 0.5).setTint(0xffe091).setAlpha(0.75);
        this.itemListContainer.add(countText);
      }

      i++;
    }
  }

  startGame() {
    this.meter = 0;
    this.isGameOver = false;

    this.lastSpawnTime = 0;
    // this.spawnEnemy("dream_of_mushroom");
    
    // ! CUSTOM
    // this.player.collectItem("double_daggers");
    // this.player.collectItem("windy_fan");
    // this.player.collectItem("bug_boots");
  }

  playerSpeedUpdated(diff: number) {
    // 모든 요소의 속도를 재조정
    this.enemies.forEach(enemy => {
      if (!enemy.isFollowCamera) {
        // enemy.velocity.x += diff;
        console.log(-diff + enemy.velocity.x);
        enemy.setVelocityX(-diff + enemy.velocity.x);
        if (enemy.entityName === 'purple_mushroom') {
          console.log(enemy.velocity.x);
        }
      }

      enemy.playerSpeedUpdated(diff);
    });

    this.layers.item.list.forEach((item: any) => {
      item.body.setVelocityX(item.body.velocity.x - diff);
    });

    this.bulletGroup.getChildren().forEach((bullet: any) => {
      bullet.body.setVelocityX(bullet.body.velocity.x - diff);
    });
  }
  
  update(time: number, delta: number): void {
    if (this.background && this.player) {
      this.background.tilePositionX += (this.player.speed * 0.75) * delta / 1000;
    }
    
    if (this.player) {
      if (this.isGameOver) return;

      this.player.update(delta);
      this.player.exp += 0.00002 * this.player.speed * delta;

      const body = this.player.body as Phaser.Physics.Arcade.Body;

      this.meter += delta * this.player.speed / 1000;
      this.meterText.setText(`${Math.floor(this.meter)}M`);
      
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        if (!this.player.hasState('stun') && !this.player.hasState('attack') && !this.isGameOver) {
          this.player.jump();
          // 점프(공격) 시작 시 타격된 적 목록 초기화
          this.hitEnemies = [];
        }
      }
      
      if (this.player.hasState('attack')) {
        this.checkSwordHits();
      } else if (this.attackRangeGraphics) {
        this.attackRangeGraphics.clear();
        // 공격 상태가 아니면 타격된 적 목록 초기화
        this.hitEnemies = [];
      }

      for (const followEffect of this.player.followEffects) {
        followEffect.setPosition(this.player.x, this.player.y - 2);
      }

      if (body.blocked.up || body.blocked.down) {
        this.player.removeState('jump');
        this.player.addState('stun');
        this.player.takeDamage(1, "wall");

        this.time.delayedCall(body.blocked.up ? 600 : 500, () => {
          this.player.removeState('stun');
        });
      }

      if (body.blocked.down) {
        this.player.jump(this.player.jumpPower * 1.5);
      }

      if (this.player.health <= 0) {
        // 기존 코드
        this.isGameOver = true;
        this.player.speed = 0;
        this.physics.world.setBoundsCollision(false, false, false, false);
        
        // 음악 페이드아웃 추가
        this.gameOver();
      }
    }
    
    for (const sword of this.swords) {
      sword.update();
    }

    const spawnCooldown = this.spawnCooldown * 30 / this.player.stats.speed;

    // * 몹 스폰
    if (this.bossIsDead && time - this.lastSpawnTime > spawnCooldown) {
      this.spawnEnemy();
      this.lastSpawnTime = time;
    }

    if (Math.floor(this.meter / 10000) > this.clearBoss) {
      this.clearBoss = Math.floor(this.meter / 10000);
      const boss = this.spawnEnemy("dream_of_mushroom");
      this.bossIsDead = false;
    }

    for (const enemy of this.enemies) {
      enemy.update(delta);
      if (enemy.health <= 0) {
        enemy.dead();
        enemy.isDead = true;
        
        // 경험치 획득
        enemy.destroy();

        enemy.isDestroyed = true;
        this.enemies = this.enemies.filter(e => e !== enemy);
        this.player.exp += enemy.exp;
      } else if (
        ((enemy.x < -100) || (enemy.y < -30)
        || (enemy.y > this.cameras.main.height + 30)
        || (enemy.x > this.cameras.main.width + 100))
        && enemy.destroyOnScreenOut
      ) {
        enemy.destroy();
        enemy.isDestroyed = true;
        this.enemies = this.enemies.filter(e => e !== enemy);
      }
    }

    this.layers.item.list.forEach((item: any) => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        item.x, item.y
      );

      if (dist <= this.player.stats.magnet) {
        this.physics.moveToObject(item,
          this.player,
          ((1 - dist / this.player.stats.magnet) * 500) + this.player.stats.speed,
        );
      }
    });
    
    // 화면 밖으로 나간 총알 제거
    this.layers.effect.list.forEach((effect: any) => {
      if (
        effect.y < -40
        || effect.y > this.cameras.main.height + 40
        || effect.x < -40
        || effect.x > this.cameras.main.width + 40
      ) {
        effect.destroy();
      }

      effect.update(delta);
    });
  }

  updateExpBar() {
    const width = 104;
    const height = 5;

    const right = this.cameras.main.width / 2 - width / 2 + 3;
    const bottom = 16;

    const x = this.cameras.main.width - width - right;
    const y = this.cameras.main.height - height - bottom;

    this.expBar.clear();
    this.expBar.fillStyle(0xfffffff);
    this.expBar.fillRoundedRect(x, y, width + 6, height + 8, 4);

    this.expBar.fillStyle(0x0a2a33);
    this.expBar.fillRoundedRect(x + 1, y + 1, width + 4, height + 6, 2);

    this.expBar.fillStyle(0x22896e);
    this.expBar.fillRoundedRect(x + 3, y + 3, width, height, 2);

    this.expBar.fillStyle(0x8cff9b);
    this.expBar.fillRoundedRect(x + 3, y + 3, 4 + (width - 4) * (this.player.exp / this.player.needExp), height, 2);

    // level
    this.levelText.setText(`Lv.${this.player.level}`);
    this.levelText.setPosition(this.cameras.main.width / 2, y - 14);
  }
  
  checkEnemyHits(player: any, enemy: any): void {
    if (enemy instanceof Enemy && enemy.attack > 0) {
      this.player.takeDamage(enemy.attack);
      enemy.takeDamage(this.player.stats.collisionDamage);
    }
  }

  checkSwordHits(): void {
    if (!this.swords || !this.player) return;
    
    const radius = this.player.getRealRange();

    const attackBody = this.physics.add.body(
      this.player.x - radius, this.player.y - radius
    ).setCircle(radius);
    
    for (const enemy of this.enemies) {
      if (this.hitEnemies.includes(enemy) || enemy.untargetability) {
        continue;
      }
      
      if (this.physics.world.overlap(attackBody, enemy.body!)) {
        const isCritcal = Math.random() < (this.player.stats.criticalChance / 100);
        const damage = isCritcal ? this.player.attack * 2 : this.player.attack;
        let damageDealt = 0;
        for (let i = 0; i < this.player.swordCount; i++) {
          damageDealt += enemy.takeDamage(damage, isCritcal)
        }
        this.hitEnemies.push(enemy);
        
        this.playSound('attack', {
          volume: 0.8
        })
      }
    }
    
    // 임시 바디 제거
    attackBody.destroy();
  }

  spawn() {

  }

  getPlayer(): Player {
    return this.player;
  }
  
  /**
   * 이펙트 레이어에 접근하기 위한 getter
   */
  getEffectLayer(): Phaser.GameObjects.Container {
    return this.layers.effect;
  }
  
  createBulletGroup(): void {
    this.bulletGroup = this.physics.add.group({
      runChildUpdate: true
    });
    
    // // 총알과 플레이어 충돌 처리
    // this.physics.add.overlap(
    //   this.bulletGroup,
    //   this.player,
    //   this.onBulletHitPlayer,
    //   undefined,
    //   this
    // );
  }

  onBulletHitPlayer(player: any, bullet: any): void {
    this.player.takeDamage(1);
    
    // 총알 제거
    bullet.destroy();
  }
  
  getBulletGroup(): Phaser.Physics.Arcade.Group {
    return this.bulletGroup;
  }
  
  /**
   * 배경 이미지 생성 및 설정
   */
  createBackground(): void {
    // TileSprite로 배경 생성 (전체 화면 크기)
    this.background = this.add.tileSprite(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      'mushroom-bg'
    );
    
    // 원점을 왼쪽 상단으로 설정
    this.background.setOrigin(0, 0);
    
    // 배경을 배경 레이어에 추가
    this.layers.background.add(this.background);
  }
  
  /**
   * 배경 음악을 재생하는 메서드
   */
  playBackgroundMusic(): void {
    // 이미 재생 중인 배경음악이 있다면 중지
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }
    
    try {
      // 배경음악 생성 및 설정
      this.bgMusic = this.sound.add('bgm', {
        volume: 0.6,
        loop: true,
        delay: 0
      });
      
      // 배경음악 재생
      this.bgMusic.play();
      
      // 오류 처리
      this.bgMusic.once('loaderror', () => {
        console.warn('오디오 로드 실패:', 'bgm');
      });
    } catch (error) {
      console.error('배경음악 재생 실패:', error);
    }
  }
  
  // 게임 종료 시 음악 중지 (필요할 경우 추가)
  gameOver(): void {
    // 이미 게임오버 상태면 return
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    
    // 배경음악 페이드아웃 (선택사항)
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.tweens.add({
        targets: this.bgMusic,
        volume: 0,
        duration: 1500,
        onComplete: () => {
          this.bgMusic.stop();
        }
      });
    }
  }

  playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | undefined {
    if (!this.sfxCounts[key]) {
      console.warn(`등록되지 않은 효과음 유형: ${key}`);
      return;
    }
    
    // 해당 유형의 효과음 개수 내에서 랜덤 선택
    const count = this.sfxCounts[key];
    const randomIndex = Math.floor(Math.random() * count) + 1;
    const soundKey = `${key}-${randomIndex}`;
    
    try {
      const sound = this.sound.add(soundKey, config);
      sound.play();
      return sound;
    } catch (error) {
      console.error(`효과음 재생 실패: ${soundKey}`, error);
      return;
    }
  }

  getExpBar(): Phaser.GameObjects.Graphics {
    return this.expBar;
  }

  createDebugFunction() {
    // 디버그용 함수
    (globalThis as any).getPlayer = () => {
      if (this.debugMode) {
        return this.player;
      }
    }

    (globalThis as any).immuneMode = () => {
      if (this.debugMode) {
        this.player.stats.evade = 100;
      }
    }
  }
}

export default GameScene;