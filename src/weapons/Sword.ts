import Player from "../entities/Player";
import GameScene from "../scenes/GameScene";
import Weapon from "./Weapon";

export default class Sword extends Weapon {
  constructor(scene: GameScene, player: Player, index: number) {
    super(scene, player, "sword", index);
    
    this.init();
  }
}