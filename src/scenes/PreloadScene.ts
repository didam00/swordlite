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
    
    // 새로운 공격 이펙트 에셋 로드
    this.load.atlas('big_effects',
      'assets/images/big_effects.png',
      'assets/images/big_effects.json'
    );
  }

  create() {
    // 로딩이 완료되면 게임 씬으로 전환
    this.scene.start('GameScene');
  }
}