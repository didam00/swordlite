import Player from "../entities/Player";
import GameScene from "../scenes/GameScene";
import Weapon from "./Weapon";

export default class CopperSword extends Weapon {
  useSwordAttackEffect = false;
  option = {
    attack: 50,
    range: 80,
    cooldown: 100,
    angleArea: 360,
  }

  constructor(scene: GameScene, player: Player, index: number) {
    super(scene, player, "copper_sword", index);
    
    this.particleColor = [0xe5959f, 0xc16a7d, 0x66334b];
    this.init();
  }
}