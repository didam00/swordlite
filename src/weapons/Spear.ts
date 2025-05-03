import Enemy from "../entities/Enemy";
import Player from "../entities/Player";
import GameScene from "../scenes/GameScene";
import Weapon from "./Weapon";

export default class Spear extends Weapon {
  useSwordAttackEffect = false;
  option = {
    attack: 125,
    range: 150,
    cooldown: 100,
    angleArea: 30,
  }
  
  constructor(scene: GameScene, player: Player, index: number) {
    super(scene, player, "spear", index);
    this.createAnimations();
  }
}