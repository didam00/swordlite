import GameScene from "../scenes/GameScene";

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "epic" | "unique";
  effect: (scene: GameScene) => void;
  type: "normal" | "dash" | "magic" | "attack";
}

const itemList: ItemDefinition[] = [
  {
    id: "giant_sword",
    name: "Giant Sword",
    description: "critical chance +20%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.criticalChance += 20;
    }
  },
  {
    id: "green_heart",
    name: "Green Heart",
    description: "heal +2",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.heal(2)
    }
  },
  {
    id: "big_mushroom",
    name: "Big Mushroom",
    description: "max health +1",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.maxHealth += 1;
      scene.player.scale += 0.3;
      scene.player.range += 2.85;
    }
  },
  {
    id: "strategy_book",
    name: "Strategy Book",
    description: "exp gain +20%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.expGain += 20;
    }
  },
  {
    id: "wind_mushroom",
    name: "Wind Mushroom",
    description: "speed +25%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.speed += 20;
    }
  },
  {
    id: "great_magnet",
    name: "Great Magnet",
    description: "item magnet +100%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.magnet += 20;
    }
  },
  // {
  //   id: "black_cloak",
  //   name: "black cloak",
  //   description: "evade chance *10%",
  //   rarity: "common",
  //   type: "normal",
  //   effect: (scene: GameScene): void => {
  //     scene.player.stats.evade += (100 - scene.player.stats.evade) * 0.1;
  //   }
  // },
  {
    id: "sugar_cube",
    name: "Sugar Cube",
      description: "evade chance *10%",
      rarity: "common",
      type: "normal",
      effect: (scene: GameScene): void => {
        scene.player.stats.evade += (100 - scene.player.stats.evade) * 0.15;
      }
  },
  {
    id: "cracker",
    name: "Cracker",
    description: "collision damage +1",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.collisionDamage += 1;
    }
  },
  {
    id: "weight",
    name: "Weight",
    description: "graivty +40%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.gravity += 0.4;
      scene.player.jumpPower += 30;
    }
  },
  {
    id: "black_coffee",
    name: "Black Coffee",
    description: "upgrade dash",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.dashDistance += 80;
      scene.player.stats.dashCoolDown *= 0.5;
    }
  },
  {
    id: "light_rod",
    name: "Light Rod",
    description: "upgrade shoot light attack",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.lightAttackSize += 100;
    }
  },
  {
    id: "double_giant_swords",
    name: "Double Giant Swords",
    description: "sword +1 and range +25%",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.addSword();
      scene.player.stats.range += 5;
    }
  },
]

export default itemList;