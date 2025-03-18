class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    this.load.image('logo', 'assets/logo.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#14665b');

    const logo = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'logo'
    );
    logo.setScale(1);
    logo.setAlpha(0);

    this.tweens.add({
      targets: logo,
      alpha: 1,
      duration: 1000,
      ease: 'Linear',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.tweens.add({
            targets: logo,
            alpha: 0,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
              this.scene.start('GameScene');
            }
          });
        });
      }
    });
  }
}

export default BootScene;