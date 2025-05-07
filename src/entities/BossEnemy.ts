import GameScene from "../scenes/GameScene";
import Enemy from "./Enemy";

export default abstract class BossEnemy extends Enemy {
  entityName = 'boss_enemy';
  exp = 750;
  
  onDead() {
    super.onDead();
    const scene = this.scene as GameScene;

    scene.bossIsDead = true;
    scene.overMaps.push(scene.map);
    scene.setMap(
      Phaser.Utils.Array.GetRandom(
        Object.keys(scene.maps).filter(map => map !== "void")
      )
    );
    scene.spawnItem("green_heart")
    scene.spawnCooldown *= 0.8;
  }
}