import GameScene from "../scenes/GameScene";

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "magic" | "unique";
  effect: (scene: GameScene) => void;
  type: "normal" | "active" | "consumable" | "passive" | "cooldown";
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
    description: "heal +1",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.heal(1)
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
      scene.player.scale += 0.1;
      scene.player.range += 1.2;
    }
  },
  // {
  //   id: "wind_mushroom",
  //   name: "Wind Mushroom",
  //   description: "when attack give poison",
  //   rarity: "common",
  //   type: "normal",
  //   effect: (scene: GameScene): void => {
      
  //   }
  // },
  // {
  //   id: "ninja_potion",
  //   name: "Ninja Potion",
  //   description: "dash upgrade",
  //   rarity: "common",
  //   type: "normal",
  //   effect: (scene: GameScene): void => {
  //     scene.player.stats.dashCoolDown -= 100;
  //     scene.player.stats.dashDistance += 5;
  //   }
  // },
  {
    id: "strategy_book",
    name: "Strategy Book",
    description: "exp gain +10%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.expGain += 1;
    }
  },
  {
    id: "great_magnet",
    name: "Great Magnet",
    description: "item magnet +40%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.magnet += 8;
    }
  },
  {
    id: "black_cloak",
    name: "black cloak",
    description: "evade chance *10%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.evade += (100 - scene.player.stats.evade) * 0.1;
    }
  },
  {
    id: "black_cloak",
    name: "black cloak",
    description: "evade chance *10%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.evade += (100 - scene.player.stats.evade) * 0.1;
    }
  },
  // {
  //   id: "shadow_bottle",
  //   name: "Shadow Bottle",
  //   description: "evade chance *10%",
  //   rarity: "common",
  //   type: "normal",
  //   effect: (scene: GameScene): void => {
  //     scene.player.stats.evade += (100 - scene.player.stats.evade) * 0.1;
  //   }
  // },
  // {
  //   id: "shadow_bottle",
  //   name: "Shadow Bottle",
  //   description: "can use dash",
  //   rarity: "epic",
  //   type: "normal",
  //   effect: (scene: GameScene): void => {
  //     scene.player.stats.evade += (100 - scene.player.stats.evade) * 0.1;
  //   }
  // },
  {
    id: "shadow_bottle",
    name: "Shadow Bottle",
    description: "can use dash",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.evade += (100 - scene.player.stats.evade) * 0.1;
    }
  },
]

export default itemList;