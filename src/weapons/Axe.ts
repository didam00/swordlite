import Player from "../entities/Player";
import GameScene from "../scenes/GameScene";
import Weapon from "./Weapon";

export default class Axe extends Weapon {
  useDefaultAttackEffect = false;

  option = {
    attack: 150,
    range: 150,
    cooldown: 200,
    angleArea: 180,
  }

  constructor(scene: GameScene, player: Player, index: number) {
    super(scene, player, "axe", index);
    this.createAnimations();
  }
}