/** // TODO
 * 1. 더블 킬 등 콤보 시스템 추가 (텍스트로 보여줌)
 * */


import Phaser from 'phaser';
import Player from '../entities/Player';
import PurpleMushroom from '../entities/PurpleMushroom';
import Entity from '../entities/Entity';
import Enemy, { AnyBullet } from '../entities/Enemy';
import RedMushroom from '../entities/RedMushroom';
import BlueMushroom from '../entities/BlueMushroom';
import itemList from '../items/ItemList';
import { createItem, Item } from '../items/Item';
import DreamOfMushroom from '../entities/DreamOfMushroom';
import FakeRedMushroom from '../entities/FakeRedMushroom';
import { StatusEffect } from '../types';
import Squid from '../entities/Squid';
import BlueFish from '../entities/BlueFish';
import Starfish from '../entities/Starfish';
import SeaAnemone from '../entities/SeaAnemone';
import Bat from '../entities/Bat';
import Torch from '../entities/Torch';
import Henge from '../entities/Henge';
import MiniStone from '../entities/MiniStone';
import Stone from '../entities/Stone';
import CRTFilter from '..';

// GameObject 타입 확장
declare module 'phaser' {
  namespace GameObjects {
    interface GameObject {
      uptime?: number;
    }
  }
}

class GameScene extends Phaser.Scene {
  readonly layers: {
    background: Phaser.GameObjects.Container,
    bottom: Phaser.GameObjects.Container,
    entity: Phaser.GameObjects.Container,
    weapon: Phaser.GameObjects.Container,
    player: Phaser.GameObjects.Container,
    effect: Phaser.GameObjects.Container,
    item: Phaser.GameObjects.Container,
    top: Phaser.GameObjects.Container,
    foreground: Phaser.GameObjects.Container,
    ui: Phaser.GameObjects.Container,
    [key: string]: Phaser.GameObjects.Container,
  } = {
    background: null!,
    bottom: null!,
    item: null!,
    entity: null!,
    weapon: null!,
    player: null!,
    effect: null!,
    top: null!,
    foreground: null!,
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
    bubble: 1,
    splash: 1,
    bat: 1,
    fire: 1,
  };

  debugMode: boolean = false;
  
  player: Player = null!;
  
  private obstacles: Entity[] = [];
  enemyGroup: Phaser.Physics.Arcade.Group = null!;
  enemies: Enemy[] = [];
  private meterText: Phaser.GameObjects.Text = null!;
  
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
  
  private bulletGroup: Phaser.Physics.Arcade.Group = null!;
  private background: Phaser.GameObjects.TileSprite = null!;
  private foreground1: Phaser.GameObjects.TileSprite = null!;
  private foreground2: Phaser.GameObjects.TileSprite = null!;
  private bgMusic: Phaser.Sound.BaseSound = null!;

  private expBar: Phaser.GameObjects.Graphics = null!;
  private levelText: Phaser.GameObjects.Text = null!;

  private itemListContainer: Phaser.GameObjects.Container = null!;

  private clearBoss: number = 0;
  private debugModeText: Phaser.GameObjects.Text = null!;
  private debugTextObject: Phaser.GameObjects.BitmapText = null!;
  private debugText: string[] = [];
  private isChangingMap: boolean = false;
  private allowSpawnEnemy: boolean = true;
  
  pointer: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };

  cursorSprite: Phaser.GameObjects.Sprite = null!;

  bossIsDead: boolean = true;
  private _now: number = 0;
  overMaps: string[] = ["void"];
  map: string = "void";
  maps: {[key: string]: string[]} = {
    "void": [],
    "violet": ["purple_mushroom", "blue_mushroom", "red_mushroom"],
    "blue": ["squid", "blue_fish", "starfish"],
    "brown": ["bat", "torch", "henge"],
  }
  
  private _gameSpeed: number = 1.0;
  private isPaused: boolean = false;
  private pauseOverlay: Phaser.GameObjects.Rectangle = null!;
  private pauseText: Phaser.GameObjects.Text = null!;
  private debugLog: {
    effectCount: number,
    emitterCount: number,
    entityCount: number,
    allCount: number,
  }[] = [];

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
    // this.cameras.main.preFX?.addColorMatrix

    // // 필터
    // const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    // if (!renderer.pipelines.has('CRTFilter')) {
    //   renderer.pipelines.addPostPipeline('CRTFilter', CRTFilter);
    // }
    // this.cameras.main.setPostPipeline('CRTFilter');

    // // 비네트 효과 추가
    // this.cameras.main.postFX.addVignette(0.5, 0.5, 0.9, 0.25);

    // // 망원 렌즈 효과 추가
    // this.cameras.main.postFX.addBarrel(1.15);

    // debug functions
    this.createDebugFunction();

    this.initLayers();
    this.createAnimations();

    const rectGraphics = this.make.graphics({x: 0, y: 0});
    rectGraphics.fillStyle(0xffffff);
    rectGraphics.fillRect(0, 0, 8, 8);
    rectGraphics.generateTexture('rect-particle', 1, 1);
    rectGraphics.destroy();
    
    const circleGraphics = this.make.graphics({x: 0, y: 0});
    circleGraphics.fillStyle(0xffffff);
    circleGraphics.fillCircle(16, 16, 16);
    circleGraphics.generateTexture('circle-particle', 32, 32);
    circleGraphics.destroy();

    this.cameras.main.setBackgroundColor('#000000');
    
    // 배경 생성 및 설정
    this.createBackground();

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

    // this.attackRangeGraphics = this.add.graphics();
    // this.layers.effect.add(this.attackRangeGraphics);

    this.debugModeText = this.add.text(10, 10, "", {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      fontFamily: 'monospace',
      resolution: 1,
    }).setScrollFactor(0).setName("debug_mode_text");
    
    // 디버그 모드 토글 키 설정 (D 키)
    this.input.keyboard?.addKey('D').on('down', () => {
      this.physics.world.drawDebug = !this.physics.world.drawDebug;
      this.debugMode = !this.debugMode;
      this.debugTextObject.setVisible(this.debugMode);
      this.debugTextObject.setText(this.debugText.join('\n'));

      if (this.physics.world.drawDebug) {
        if (!this.physics.world.debugGraphic) {
          this.physics.world.debugGraphic = this.add.graphics()
            .setDepth(999)
            .setName("debug_graphic");
        }
        this.physics.world.drawDebug = true;
      } else {
        if (this.physics.world.debugGraphic) {
          this.physics.world.debugGraphic.clear();
        }
        this.physics.world.drawDebug = false;
      }

      this.showDebugModeText(this.debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF');
    });

    this.input.keyboard?.addKey('G').on('down', () => {
      if (this.debugMode) {
        this.player.isGodMode = !this.player.isGodMode;
        this.showDebugModeText('God Mode: ' + (this.player.isGodMode ? 'ON' : 'OFF'));
      }
    })

    this.input.keyboard?.addKey('S').on('down', () => {
      if (this.debugMode) {
        this.allowSpawnEnemy = !this.allowSpawnEnemy;
        this.showDebugModeText('Allow Spawn: ' + (this.player.isGodMode ? 'ON' : 'OFF'));
      }
    })

    this.input.keyboard?.addKey('L').on('down', () => {
      if (this.debugMode) {
        this.player.exp += this.player.needExp;
      }
    })

    this.input.keyboard?.addKey('B').on('down', () => {
      if (this.debugMode) {
        this.background.visible = !this.background.visible;
        this.cameras.main.setBackgroundColor(this.background.visible ? '#000000' : '#606060');
        this.showDebugModeText('Background: ' + (this.background.visible ? 'ON' : 'OFF'));

        this.foreground1.visible = !this.foreground1.visible;
        this.foreground2.visible = !this.foreground2.visible;
      }
    })
    
    this.input.keyboard?.addKey('esc').on('down', () => {
      this.togglePause();
    })

    // effect and emitters on/off
    // this.input.keyboard?.addKey('E').on('down', () => {
    //   if (this.debugMode) {
    //     this.layers.effect.visible = !this.layers.effect.visible;
    //     // 모든 레이어의 파티클 제어
    //     Object.values(this.layers).forEach(layer => {
    //       if (layer instanceof Phaser.GameObjects.Container) {
    //         layer.list.forEach((obj: any) => {
    //           if (obj instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
    //             if (this.layers.effect.visible) {
    //               obj.start();
    //             } else {
    //               obj.stop();
    //             }
    //           }
    //         });
    //       }
    //     });
    //     this.showDebugModeText('Effect: ' + (this.layers.effect.visible ? 'ON' : 'OFF'));
    //   }
    // })

    this.input.keyboard?.on('keydown-PLUS', () => {
      if (this.debugMode) {
        this.gameSpeed = Math.min(25, this.gameSpeed + 0.25);
        this.showDebugModeText(`Game Speed: ${this.gameSpeed.toFixed(1)}x`);
      }
    });
    
    this.input.keyboard?.on('keydown-MINUS', () => {
      if (this.debugMode) {
        this.gameSpeed = Math.max(0.1, this.gameSpeed - 0.25);
        this.showDebugModeText(`Game Speed: ${this.gameSpeed.toFixed(1)}x`);
      }
    });
    
    this.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.debugMode) {
        this.meter += 1000
        this.showDebugModeText(`Teleport to ${this.meter}`);
      }
    });

    // 거리 표시
    this.meterText = this.add.text(this.cameras.main.width - 8, 8, '0M', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      resolution: 1,
    }).setName("meter_text_ui")
      .setScrollFactor(0)
      .setOrigin(1, 0);
    this.layers.ui.add(this.meterText);

    // 경험치 표시
    this.levelText = this.add.text(this.cameras.main.width - 8, 24, '', {
      fontFamily: 'monospace',
      fontSize: '9pt',
      color: '#ffffff',
      resolution: 1,
    }).setName("exp_text_ui")
      .setScrollFactor(0)
      .setOrigin(0.5, 0);
    this.expBar = this.add.graphics().setName("exp_bar_ui");
    this.updateExpBar();

    // 디버그 표시
    this.debugTextObject = this.add.bitmapText(10, 28, 'mini', '', 10)
    this.debugTextObject
      .setName("debug_text_ui")
      .setScrollFactor(0)
      .setOrigin(0, 0)
      .setTint(0xffffff);
    
    this.layers.ui.add(this.levelText);
    this.layers.ui.add(this.expBar);
    this.layers.ui.add(this.debugTextObject);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.player.hasItem("black_coffee") && pointer.rightButtonDown()) {
        this.player.dash();
      }
    });

    this.cursorSprite = this.add.sprite(0, 0, 'cursor').setName("cursor");
    this.cursorSprite.setScrollFactor(0);
    this.cursorSprite.setDepth(9999);
    this.cursorSprite.setBlendMode(Phaser.BlendModes.DIFFERENCE);
    this.layers.ui.add(this.cursorSprite);

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.pointer.x = pointer.x;
      this.pointer.y = pointer.y;

      this.cursorSprite.x = pointer.x;
      this.cursorSprite.y = pointer.y;
    })

    this.itemListContainer = this.add.container(this.cameras.main.width - 14, 32).setName("item_list_ui");
    this.itemListContainer.setScrollFactor(0);
    this.layers.ui.add(this.itemListContainer);

    this.startGame();

    // 일시정지 오버레이 생성
    this.pauseOverlay = this.add.rectangle(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    ).setName("pause_overlay_rect");
    this.pauseOverlay.setOrigin(0, 0);
    this.pauseOverlay.setScrollFactor(0);
    this.pauseOverlay.setDepth(9999);
    this.pauseOverlay.setVisible(false);

    this.pauseText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'PAUSED',
      {
        fontFamily: 'monospace',
        // fontSize: '32px',
        color: '#ffffff',
        resolution: 1,
      }
    ).setName("pause_text");

    
    this.pauseText.setOrigin(0.5);
    this.pauseText.setScrollFactor(0);
    this.pauseText.setDepth(10000);
    this.pauseText.setVisible(false);

    // 객체 생성 시간 추적을 위한 이벤트 리스너 추가
    this.events.on('add', (gameObject: Phaser.GameObjects.GameObject) => {
      gameObject.uptime = this._now;
    });
  }

  createAnimations(): void {
    this.createAnimation("effects", "blue_spore", [0, 5], 24);
    this.createAnimation("effects", "item", [0, 6], 24);
    this.createAnimation("effects", "light_bullet", [0, 1], 24);
    this.createAnimation("effects", "soul", [0, 1], 24);
    this.createAnimation("effects", "soul_boom", [0, 9], 24, 0);
    this.createAnimation("effects", "windy_attack", [0, 1], 24, 0);
    this.createAnimation("effects", "ninja_banana", [0, 5], 24, 0);
    this.createAnimation("effects", "jump", [0, 6], 32, 0);
    this.createAnimation("effects", "lightning", [0, 2], 24);
    this.createAnimation("effects", "fireball_spawn", [0, 5], 48, 0);
    this.createAnimation("effects", "fireball_shoot", [0, 1], 48);
    this.createAnimation("effects", "fireball_boom", [0, 7], 32, 0);
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
    level = level || (Math.floor(this.meter / 10000 + 1 + this.player.curse / 10));

    if (!id) {
      id = Phaser.Utils.Array.GetRandom(this.maps[this.map]);
    }

    if (id !== null) {
      const EnemyClass = {
        'purple_mushroom': PurpleMushroom,
        'blue_mushroom': BlueMushroom,
        'red_mushroom': RedMushroom,
        'dream_of_mushroom': DreamOfMushroom,
        'fake_red_mushroom': FakeRedMushroom,

        'squid': Squid,
        'blue_fish': BlueFish,
        'starfish': Starfish,
        'sea_anemone': SeaAnemone,

        'bat': Bat,
        'torch': Torch,
        'henge': Henge,
        'stone': Stone,
        'mini_stone': MiniStone,
      }[id] || FakeRedMushroom;

      enemy = new EnemyClass(
        this,
        this.cameras.main.width + 20,
        Phaser.Math.Between(10, this.cameras.main.height - 10)
      );
    }

    this.enemies.push(enemy);
    this.layers.entity.add(enemy);
    this.enemyGroup.add(enemy);
    
    enemy.velocity = [0, 0];
    enemy.health = Math.floor(enemy.stats.health * (level ** 2));
    enemy.stats.defense = Math.floor(enemy.stats.defense * (level ** 1.5));
    enemy.level = level;

    enemy.onSpawn();
    return enemy;
  }

  spawnItem(): Item | null;
  spawnItem(rarity: "common" | "epic" | "unique", x?: number, y?: number): Item | null;
  spawnItem(id: string, x?: number, y?: number): Item | null;

  spawnItem(rarityOrId?: string, x?: number, y?: number): Item | null {
    // 무작위 기본 아이템 생성
    const validItems = itemList.filter(item => {
      if (rarityOrId === "common" || rarityOrId === "epic" || rarityOrId === "unique") {
        return item.rarity === rarityOrId;
      } else {
        if (rarityOrId === undefined) {
          return true;
        } else {
          return item.id === rarityOrId;
        }
      }
    });
    const randomItem = validItems[Math.floor(Math.random() * validItems.length)];

    if (!x) {
      x = this.cameras.main.width + 24 + Math.random() * 48;
    }
    if (!y) {
      y = this.player.y - 24 + Math.random() * 48;
      y = Math.max(24, Math.min(this.cameras.main.height - 24, y));
    }

    const item = createItem(
      randomItem.id,
      x,
      y,
      this
    );  

    // if (Math.random() < ((this.player.curse + 40) / 100 + 0.1)) {
    //   const randomItem = validItems[Math.floor(Math.random() * validItems.length)];
    //   const cursedItem = createItem(
    //     randomItem.id,
    //     this.cameras.main.width + 16 + Math.random() * 16,
    //     (this.cameras.main.height - 40) * Math.random() + 20,
    //     this,
    //     true
    //   )
    // }

    return item;
  }
  
  initLayers(): void {
    for (const key in this.layers) {
      this.layers[key] = this.add.container(0, 0);
      this.layers[key].setName(`${key}_layer`)
    }
  }
  
  createPlayer(): void {
    this.player = new Player(
      this, 
      64,
      this.cameras.main.height / 2
    );
    
    if (this.layers.player) {
      this.layers.player.add(this.player);
    }

    this.player.setCollideWorldBounds(true);

    this.player.events.on('healthChanged', this.updateHealthUI, this);
    this.player.events.on('levelUp', () => {
      let rarity: string = "common";
      let random = Math.random();
      if (random < 0.2 * this.player.stats.luck / 100) {
        rarity = "epic";
      }
      this.spawnItem(rarity);
    });
    this.player.events.on('speedChanged', this.playerSpeedUpdated, this);
    this.player.events.on('itemCollected', this.updateItemList, this);
  }

  createSword(): void {
    this.player.addWeapon("sword");
    // this.player.addWeapon("copper_sword");
  }

  createHealthUI(): void {
    const left = 12;
    const top = 8;
    
    // 기존 하트 삭제
    this.healthHearts.forEach(heart => {
      (heart as any).outline.destroy();
      heart.destroy()
    });
    this.healthHearts = [];

    const outlines: Phaser.GameObjects.Sprite[] = [];
    
    // 테두리만 먼저 생성
    for (let i = 0; i < this.player.stats.maxHealth; i++) {
      const outline = this.add.sprite(
        left + i * this.HEART_SPACING,
        top,
        'ui',
        'heart-outline'
      );

      outline.name = `heart-outline-${i}`
      
      outline.setScrollFactor(0)
             .setScale(1)
             .setOrigin(0, 0)
             .setDepth(9998)
             .setVisible(true)
             .setAlpha(1);
      
      this.layers.ui.add(outline);
      outlines.push(outline);
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
      heart.name = `heart-${i}`
      
      // 명시적으로 모든 속성 설정
      heart.setScrollFactor(0)
           .setScale(1)
           .setOrigin(0, 0)
           .setDepth(9999)
           .setAlpha(1)
           .setVisible(true);
      
      // 디버깅용 테두리 추가 (보이는지 확인용)
      heart.setTint(0xffffff);
      (heart as any).outline = outlines[i]; // 테두리와 연결
      
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
    const maxHealthDecreased = maxHealth < previousMaxHealth;
    
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
    if (maxHealthIncreased || maxHealthDecreased) {
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
              if (heart && heart.active) {
                heart.setTexture('ui', emptyHeartFrame);
              }
            }
          });
        }
      }
    });
  }

  updateItemList(): void {
    let i = 0;
    this.itemListContainer.removeAll(true);

    if (this.player.curse > 0) {
      const itemSprite = this.add.sprite(0, i * 14, 'items', `curse-0`);
      itemSprite.setOrigin(0.5, 0.5).setAlpha(0.5);
      this.itemListContainer.add(itemSprite);

      if (this.player.curse > 1) {
        const countText = this.add.bitmapText(4, i * 14 + 2, 'mini', this.player.curse.toString());
        countText.setOrigin(0.5, 0.5).setTint(0xd83843).setAlpha(0.75);
        this.itemListContainer.add(countText);
      }

      i++;
    }
    
    for (const item of Object.keys(this.player.items)) {
      const itemData = itemList.find(i => i.id === item)!;

      if (!itemData.displayOnList) continue;

      const itemSprite = this.add.sprite(0, i * 14, 'items', `${item}-0`);
      itemSprite.setOrigin(0.5, 0.5).setAlpha(0.5);
      this.itemListContainer.add(itemSprite);
      itemSprite.name = `item_display-${item}`
      
      if (this.player.items[item] > 1) {
        const countText = this.add.bitmapText(4, i * 14 + 2, 'mini', `${this.player.items[item]}`);
        countText.setOrigin(0.5, 0.5).setTint(0xffe091).setAlpha(0.75);
        this.itemListContainer.add(countText);
        itemSprite.name = `item_display_text-${item}`
      }

      i++;
    }
  }

  startGame() {
    this.meter = 0;
    this.isGameOver = false;

    this.lastSpawnTime = 0;
    
    // ! CUSTOM

    for (let i = 0; i < 3; i++) {
      // this.player.collectItem("windy_fan");
      // this.player.collectItem("black_coffee");
      // this.player.collectItem("portable_mirror");
      // this.player.collectItem("lightning_rod");
      // this.player.collectItem("lightning_book");
      // this.player.collectItem("flame_book");
      // this.player.collectItem("copper_sword");
      // this.player.collectItem("giant_sword");
      // this.player.collectItem("boomerang");
      // // this.player.collectItem("pickaxe");
      // this.player.collectItem("ninja_banana");
    }
    this.player.collectItem("mace");
    // this.player.collectItem("copper_sword");

    this.player.collectItem(
      Phaser.Utils.Array.GetRandom(itemList.filter(item => item.rarity === "epic")).id
    );
    
    // this.setMap("brown");

    this.setMap(
      Phaser.Utils.Array.GetRandom(
        Object.keys(this.maps).filter(map => map !== "void")
      )
    );

    // this.gameSpeed = 0.5;
    // this.setMap(
    //   "blue"
    // );
  }

  playerSpeedUpdated(diff: number) {
    // 모든 요소의 속도를 재조정
    this.enemies.forEach(enemy => {
      if (!enemy.isFollowCamera) {
        // enemy.velocity.x += diff;
        enemy.setVelocityX(-diff + enemy.velocity.x);
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
    // 일시정지 상태면 업데이트 중단
    if (this.isPaused) return;
    
    delta = delta * this._gameSpeed;
    this._now += delta;

    if (this.background && this.foreground1 && this.foreground2 && this.player) {
      this.background.tilePositionX += (this.player.speed * 0.4) * delta / 1000;
      this.foreground1.tilePositionX += (this.player.speed * 1.5) * delta / 1000;
      this.foreground2.tilePositionX += (this.player.speed * 2) * delta / 1000;
    }
    
    if (this.player) {
      if (this.isGameOver) return;

      this.player.update(delta);
      this.player.exp += 0.00001 * this.player.speed * delta;

      const body = this.player.body as Phaser.Physics.Arcade.Body;

      if (this.bossIsDead) {
        this.meter += delta * this.player.speed / 1000;
      }
      this.meterText.setText(`${Math.floor(this.meter)}M`);
      
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
        if (!this.player.hasState('stun') && !this.player.hasState('attack') && !this.isGameOver) {
          this.player.jump();
          // 점프(공격) 시작 시 타격된 적 목록 초기화
        }
      }
      
      if (this.player.hasState('attack')) {
        // this.checkSwordHits();
      } else if (this.attackRangeGraphics) {
        this.attackRangeGraphics.clear();
        // 공격 상태가 아니면 타격된 적 목록 초기화
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
    
    for (const weapon of this.player.weapons) {
      weapon.update();
    }

    const spawnCooldown = this.spawnCooldown * 30 / this.player.stats.speed;

    // * 몹 스폰
    if (!this.isChangingMap && this.allowSpawnEnemy && this.bossIsDead && time - this.lastSpawnTime > (spawnCooldown * (1 - this.player.curse / 44 + 0.1))) {
      const enemy = this.spawnEnemy();
      this.lastSpawnTime = time;
      enemy?.onNaturalSpawn();
    }

    if (Math.floor(this.meter / 10000) > this.clearBoss) {
      this.clearBoss = Math.floor(this.meter / 10000);
      const boss = this.spawnEnemy("dream_of_mushroom");
      this.bossIsDead = false;
    }

    for (const enemy of this.enemies) {
      enemy.statusEffects.forEach((effect: StatusEffect) => {
        if (effect.duration > 0) {
          effect.duration -= delta;
        } else {
          enemy.removeStatusEffect(effect.id);
        }
      });

      if (!(enemy.isStun || enemy.isFlee)) {
        enemy.update(delta);
      }
      if (enemy.isFlee) {
        // enemy.rotation = Phaser.Math.Angle.Between(
        //   this.player.x, this.player.y,
        //   enemy.x, enemy.y
        // ) + Math.PI / 2;

        // enemy.vx = Math.cos(enemy.rotation) * this.player.speed;
        // enemy.vy = Math.sin(enemy.rotation) * this.player.speed;

        enemy.rotation = Math.PI / 2;
        enemy.vx = this.player.speed + 10;
      }
      if (enemy.health <= 0) {
        // 경험치 획득
        // enemy.destroy();
        enemy.setTint(0x808080);
        enemy.setGravityY(500);

        const randAngle = Math.random() * Math.PI - Math.PI / 2;
        const randX = Math.cos(randAngle) * 200 * (this.player.damage / 10);
        const randY = Math.sin(randAngle) * 200 * (this.player.damage / 10);
        enemy.setVelocity(randX, randY);

        enemy.isDestroyed = true;
        this.enemies = this.enemies.filter(e => e !== enemy);
        this.player.exp += enemy.exp;

        const soulCandle = this.player.hasItem("soul_candle");
        // Soul Candle 효과
        if (soulCandle > 0 && Math.random() < ((1 + soulCandle) / 20) * (this.player.stats.luck / 100)) {
          const itemId = Phaser.Utils.Array.GetRandom([
            "soul_of_power",
            "soul_of_life",
            "soul_of_knowledge",
          ]);
          const item = this.spawnItem(itemId, enemy.x, enemy.y);
          const direction = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          item?.setVelocity(
            Math.cos(direction) * 40 - this.player.stats.speed,
            Math.sin(direction) * 40
          );
          item?.setDamping(true);
          // item?.setDrag(.5, .5);
        }

        const conquestFlag = this.player.hasItem("conquest_flag");
        if (conquestFlag > 0) {
          // 가까운 엔티티들에게 flee 효과 부여
          this.enemies.forEach((e: any) => {
            if (e !== enemy && !e.isFlee) {
              const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                e.x, e.y
              );
              if (dist < 100) {
                e.takeFlee(1000);
              }
            }
          });
        }

        // dead가 먼저 실행되어야함!
        enemy.onDead();
        enemy.remove();
        enemy.isDead = true;

        this.playSound('hit', {
          volume: 0.4,
          rate: 1.5,
        });
      } else if (
        ((enemy.x < -100) || (enemy.y < -30)
        || (enemy.y > this.cameras.main.height + 30)
        || (enemy.x > this.cameras.main.width + 100))
        && enemy.destroyOnScreenOut
      ) {
        enemy.remove();
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

      if (
        item.y < -80
        || item.y > this.cameras.main.height + 80
        || item.x < -80
        || item.x > this.cameras.main.width + 80
      ) {
        item.remove();
      }
    });
    
    // 화면 밖으로 나간 총알 제거
    this.layers.effect.list.forEach((effect: any) => {
      if (
        (effect.y < -40
        || effect.y > this.cameras.main.height + 40
        || effect.x < -40
        || effect.x > this.cameras.main.width + 40)
        && !((effect as any).isBoomerang)
      ) {
        if (effect.config?.emitter) {
          this.time.delayedCall(effect.config.emitterDeleteTime, () => {
            effect.config.emitter.destroy();
          });
        }

        effect.destroy();
      }

      effect.update(delta);
    });

    if (this.debugMode) {
      this.updateDebugText();
    }
  }

  updateDebugText(): void {
    let allCount = this.children.length;
    let emitterCount = 0;

    // let visibleCount = this.children.list.filter((child: any) => 
    //   child.x > -20 && child.x < this.cameras.main.width + 20 &&
    //   child.y > -20 && child.y < this.cameras.main.height + 20
    // ).length;

    this.children.list.forEach((child: any) => {
      if (child instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
        allCount += (child as any).alive.length ?? 0;
        emitterCount += (child as any).alive.length ?? 0;
      }
    });

    const enemyCount = this.enemies.length + this.layers.player.list.length;
    const effectCount = this.layers.effect.list.length + this.layers.top.list.length + this.layers.bottom.list.length;

    Object.values(this.layers).forEach(layer => {
      if (layer instanceof Phaser.GameObjects.Container) {
        allCount += layer.list.length;
        
        layer.list.forEach((child: any) => {
          if (child instanceof Phaser.GameObjects.Particles.ParticleEmitter) {
            allCount += (child as any).alive.length ?? 0;
            emitterCount += (child as any).alive.length;
          }
        })
      }
    });

    this.debugText = [
      `all: ${allCount}`,
      `enemies: ${enemyCount}`,
      `effects: ${effectCount}`,
      `emitter: ${emitterCount}`,
    ]
    
    this.debugLog.push({
      entityCount: enemyCount,
      effectCount: effectCount,
      emitterCount: emitterCount,
      allCount: allCount,
    })

    this.debugTextObject.setText(this.debugText.join('\n'));
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
    if (enemy instanceof Enemy && enemy.damage > 0 && !enemy.isDead) {
      this.player.takeDamage(enemy.damage);
      enemy.takeDamage(this.player.stats.collisionDamage);
    }
  }

  checkSwordHits(): void {
    // if (!this.swords || !this.player) return;
    
    // const radius = this.player.getRealRange();

    // const attackBody = this.physics.add.body(
    //   this.player.x - radius, this.player.y - radius
    // ).setCircle(radius);
    
    // for (const enemy of this.enemies) {
    //   if (this.hitEnemies.includes(enemy) || enemy.untargetability) {
    //     continue;
    //   }
      
    //   if (this.physics.world.overlap(attackBody, enemy.body!)) {
    //     const isCritcal = Math.random() < (this.player.stats.criticalChance / 100);
    //     const damage = isCritcal ? this.player.attack * 2 : this.player.attack;
    //     let damageDealt = 0;
    //     for (let i = 0; i < this.player.swordCount; i++) {
    //       damageDealt += enemy.takeDamage(damage, isCritcal)
    //     }
    //     this.hitEnemies.push(enemy);
        
    //     this.playSound('attack', {
    //       volume: 0.8
    //     })
    //   }
    // }
    
    // // 임시 바디 제거
    // attackBody.destroy();
  }

  spawn() {

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

  getBulletList(): AnyBullet[] {
    return this.bulletGroup.getChildren() as AnyBullet[];
  }

  addInBulletGroup(sprite: Phaser.GameObjects.Sprite, damage: number): void {
    this.add.existing(sprite);
    this.physics.add.overlap(sprite, this.player, () => {
      this.player.takeDamage(damage);
      sprite.destroy();
    });
    this.bulletGroup.add(sprite);
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
      'backgrounds',
      this.map
    ).setName("background");
    
    // 원점을 왼쪽 상단으로 설정
    this.background.setOrigin(0, 0);
    
    // 배경을 배경 레이어에 추가
    this.layers.background.add(this.background);

    this.foreground1 = this.add.tileSprite(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      'foregrounds',
      this.map
    ).setName("foreground1");

    this.foreground2 = this.add.tileSprite(
      0, -32,
      this.cameras.main.width,
      this.cameras.main.height,
      'foregrounds',
      this.map
    ).setName("foreground2");

    this.foreground1.setOrigin(0, 0);
    this.layers.foreground.add(this.foreground1);

    this.foreground2.setOrigin(0, 0);
    this.foreground2.setScale(1.25);
    this.layers.foreground.add(this.foreground2);
  }
  
  /**
   * 배경 음악을 재생하는 메서드
   */
  playBackgroundMusic(name: string): void {
    const playMusic = () => {
      this.bgMusic = this.sound.add(name, {
        volume: 0.6,
        loop: true,
        delay: 0
      });
  
      this.bgMusic.play();
    }

    // 이미 있다면 기존 노래 페이드 아웃
    if (this.bgMusic) {
      this.tweens.add({
        targets: this.bgMusic,
        volume: 0,
        duration: 500,
        onComplete: () => {
          playMusic();
        }
      });
    } else {

    }

    // 500ms 뒤에 페이드인
    this.time.delayedCall(500, () => {
      playMusic();
    });
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
          if (this.bgMusic) {
            this.bgMusic.stop();
          }
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

    (globalThis as any).getObjects = () => {
      if (this.debugMode) {
        return this.getObjects();
      }
    }

    (globalThis as any).getLog = () => {
      if (this.debugMode) {
        return this.debugLog;
      }
    }
  }

  showDebugModeText(text: string) {
    this.debugModeText.setText(text);
    this.debugModeText.setVisible(true);
    this.time.delayedCall(2000, () => {
      this.debugModeText.setVisible(false);
    });
  }

  createAnimation(atlasKey: string, animKey: string): void;
  createAnimation(atlasKey: string, animKey: string, atlasFrameName?: string): void;

  createAnimation(atlasKey: string, animKey: string, range: [number, number], frameRate?: number, repeat?: number): void;
  createAnimation(atlasKey: string, animKey: string, prefix: string, range: [number, number], frameRate?: number, repeat?: number): void;

  createAnimation(atlasKey: string, animKey: string, atlasFrameNameOrPrefix?: string | [number, number], rangeOrFrameRate?: number | [number, number], frameRateOrRepeat?: number, repeatParam?: number): void {
    if (this.anims.exists(animKey)) return;

    if (Entity.loadedAnimation.includes(animKey)) {
      return;
    } else {
      Entity.loadedAnimation.push(animKey);
    }

    if (Array.isArray(atlasFrameNameOrPrefix)) {
      const range = atlasFrameNameOrPrefix;
      const frameRate = typeof rangeOrFrameRate === 'number' ? rangeOrFrameRate : 24;
      const repeat = typeof frameRateOrRepeat === 'number' ? frameRateOrRepeat : -1;
      
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNames(atlasKey, {
            prefix: animKey + "-",
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
      const atlasFrameName = atlasFrameNameOrPrefix ?? animKey+"-0";
      
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: [{ key: atlasKey, frame: atlasFrameName }],
        });
      }
    } else {
      const atlasFrameNamePrefix = atlasFrameNameOrPrefix ?? animKey;
      
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNames(atlasKey, {
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
      const atlasFrameName = atlasFrameNameOrPrefix ?? animKey+"-0";
      
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: [{ key: atlasKey, frame: atlasFrameName }],
        });
      }
    } else {
      const atlasFrameNamePrefix = atlasFrameNameOrPrefix ?? animKey;
      
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNames(atlasKey, {
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

  setMap(key: string): void {
    if (this.map === key) return;
    
    this.map = key;
    this.isChangingMap = true;

    this.tweens.add({
      targets: [this.background, this.foreground1, this.foreground2],
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.background.setTexture('backgrounds', key);
        this.foreground1.setTexture('foregrounds', key);
        this.foreground2.setTexture('foregrounds', key);

        this.tweens.add({
          targets: [this.background],
          alpha: 1,
          duration: 1000,
        })

        this.tweens.add({
          targets: [this.foreground1],
          alpha: 0.25,
          duration: 1000,
        })

        this.tweens.add({
          targets: [this.foreground2],
          alpha: 0.1,
          duration: 1000,
        })

        this.isChangingMap = false;
      }
    })

    this.playBackgroundMusic(`${this.map}_bgm`);
  }

  getObjects(sort: boolean = true) {
    const objects = this.children.list;

    if (sort) {
      objects.sort((a: any, b: any) => (a.uptime ?? 0) - (b.uptime ?? 0));
    }

    return objects;
  }

  get now(): number {
    return this._now;
  }

  get gameSpeed(): number {
    return this._gameSpeed;
  }

  set gameSpeed(value: number) {
    this._gameSpeed = value;
    this.time.timeScale = 1 / value;  // Scene의 timeScale 설정
    this.physics.world.timeScale = 1 / value;  // 물리 엔진의 timeScale 설정
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // 게임 일시정지
      this.gameSpeed = 0;
      this.physics.world.pause();  // 물리 엔진 일시정지
      this.pauseOverlay.setVisible(true);
      this.pauseText.setVisible(true);
      
      // 배경음악 일시정지
      if (this.bgMusic && this.bgMusic.isPlaying) {
        this.bgMusic.pause();
      }
    } else {
      // 게임 재개
      this.gameSpeed = 1;
      this.physics.world.resume();  // 물리 엔진 재개
      this.pauseOverlay.setVisible(false);
      this.pauseText.setVisible(false);
      
      // 배경음악 재개
      if (this.bgMusic && !this.bgMusic.isPlaying) {
        this.bgMusic.resume();
      }
    }
  }
}

export default GameScene;