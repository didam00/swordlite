import Player from "../entities/Player";
import GameScene from "../scenes/GameScene";
import Weapon from "./Weapon";

export default class Pixckaxe extends Weapon {
  useDefaultAttackEffect = false;
  dontAttack = true;

  option = {
    attack: 100,
    range: 100,
    cooldown: 100,
    angleArea: 360,
  }

  constructor(scene: GameScene, player: Player, index: number) {
    super(scene, player, "pickaxe", index);

    this.particleColor = [0xa5e6ff, 0x66334b];
    this.init();
  }
}