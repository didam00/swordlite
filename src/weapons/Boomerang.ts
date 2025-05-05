import Enemy from "../entities/Enemy";
import Player from "../entities/Player";
import GameScene from "../scenes/GameScene";
import Weapon from "./Weapon";

export default class Boomerang extends Weapon {
  useSwordAttackEffect = false;
  dontAttack = true;
  isThrowing: boolean = false;

  option = {
    attack: 100,
    range: 100,
    cooldown: 100,
    angleArea: 360,
  }

  constructor(scene: GameScene, player: Player, index: number) {
    super(scene, player, "boomerang", index);

    this.particleColor = [0xa5e6ff, 0x66334b];
    this.init();
  }

  onJump() {
    if (!this.isThrowing) {
      this.isThrowing = true;
      this.throwingBoomerang();
    }
  }

  throwingBoomerang(angleAlpha: number = 0, customSpeed: number = 0): void {
    this.visible = false;
    this.emitter.stop();

    const boomerang = this.scene.add.sprite(this.x, this.y, 'effects', 'boomerang-0');
    (boomerang as any).isBoomerang = true;
    this.scene.physics.add.existing(boomerang);
    const body = boomerang.body as Phaser.Physics.Arcade.Body;

    body.setSize(32, 32);
    boomerang.setScale(this.player.range / 35 - 0.1);
    
    const pointer = this.scene.input.activePointer;
    let targetAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    let boomerangSpeed = customSpeed || dist * 1.5;
    boomerangSpeed *= 1 + (1 - this.player.stats.coolDown / 100) * 3;
    targetAngle += angleAlpha;
    let isTurn = false;

    let boomerangHits: Enemy[] = [];

    const update = (time: number, delta: number) => {
      if (isTurn) {
        targetAngle = Phaser.Math.Angle.Between(this.x, this.y, boomerang.x, boomerang.y);
        
        if (Phaser.Math.Distance.Between(this.x, this.y, boomerang.x, boomerang.y) < 4) {
          boomerang.destroy();
          this.scene.events.off('update', update);
          this.isThrowing = false;

          this.visible = true;
          this.emitter.start();
          return;
        }
      }

      if (boomerangSpeed < 0 && !isTurn) {
        boomerangHits = [];
        isTurn = true;
      }

      const times = (1 + (1 - this.player.stats.coolDown / 100) * 3) ** 2;
      boomerangSpeed -= delta * 0.25 * times;
      boomerang.rotation += boomerangSpeed * 0.00025 * times * delta;

      body.setVelocity(
        Math.cos(targetAngle) * boomerangSpeed - this.player.speed,
        Math.sin(targetAngle) * boomerangSpeed
      );

      this.scene.physics.world.overlap(boomerang, this.scene.enemyGroup, (boomerang, enemy) => {
        if (enemy instanceof Enemy && !boomerangHits.includes(enemy)) {
          enemy.takeDamage(this.player.damage, false, ["attack"]);
          boomerangHits.push(enemy);
        }
      });
    }

    this.scene.events.on('update', update);
    
    this.scene.layers.effect.add(boomerang);
  }
}