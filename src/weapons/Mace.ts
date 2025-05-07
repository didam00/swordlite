import Enemy from "../entities/Enemy";
import Player from "../entities/Player";
import GameScene from "../scenes/GameScene";
import Weapon from "./Weapon";

export default class Mace extends Weapon {
  // useSwordAttackEffect = false;
  // dontAttack = true;

  option = {
    attack: 50,
    range: 100,
    cooldown: 0,
    angleArea: 360,
  }

  constructor(scene: GameScene, player: Player, index: number) {
    super(scene, player, "mace", index);

    this.particleColor = [0x464b8c, 0xc1d9f2];
    this.attackEffectColor = 0x909edd;

    this.init();
  }

  onJump() {
    super.onJump();

    this.option.attack = Math.max(this.player.body!.velocity.y - 50, 10);
    console.log(this.option.attack);
  }

  onAttack(enemy: Enemy) {
    super.onAttack(enemy);

    if (this.option.attack > 150) {
      this.scene.time.delayedCall(Math.random() * 100, () => {
        const dist = Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        const effect = this.scene.add.sprite(enemy.x + Math.cos(angle) * dist, enemy.y + Math.sin(angle) * dist, 'soul_boom-0');
        effect.play('soul_boom');
        effect.setScale(this.option.attack / 500);

        this.scene.layers.effect.add(effect);
        effect.on('animationcomplete-soul_boom', () => {
          effect.destroy();
        });
      })
    }
  }
}