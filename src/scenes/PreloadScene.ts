import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.atlas('atlas',
      'assets/images/atlas.png',
      'assets/images/atlas.json'
    );

    this.load.atlas('items',
      'assets/images/items.png',
      'assets/images/items.json'
    );
    
    // 새로운 공격 이펙트 에셋 로드
    this.load.atlas('effects',
      'assets/images/effects.png',
      'assets/images/effects.json'
    );
    
    this.load.atlas('ui',
      'assets/images/ui.png',
      'assets/images/ui.json'
    );

    this.load.bitmapFont('font',
      'assets/fonts/font.png',
      'assets/fonts/font.fnt'
    );

    this.load.bitmapFont('mini',
      'assets/fonts/mini.png',
      'assets/fonts/mini.fnt'
    );
    
    this.load.atlas('backgrounds',
      'assets/images/backgrounds.png',
      'assets/images/backgrounds.json'
    );

    this.load.atlas('foregrounds',
      'assets/images/foregrounds.png',
      'assets/images/foregrounds.json'
    );

    this.load.image('cursor', 'assets/images/cursor.png');
    
    // 배경음악 로드
    this.load.audio('violet_bgm', 'assets/music/resolution.wav');
    this.load.audio('blue_bgm', 'assets/music/peaceful.wav');
    this.load.audio('brown_bgm', 'assets/music/go for it.wav');
    // this.load.audio('bgm', 'assets/music/pensive.wav');
  }

  create() {
    // 로딩이 완료되면 게임 씬으로 전환
    this.scene.start('GameScene');
  }
}