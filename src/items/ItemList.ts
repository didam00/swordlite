import GameScene from "../scenes/GameScene";

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "epic" | "unique";
  effect: (scene: GameScene) => void;
  type: "normal" | "dash" | "magic" | "attack";
  displayOnList: boolean;
}

const itemList: ItemDefinition[] = [
  {
    id: "giant_sword",
    name: "Giant Sword",
    description: "range +15% and damage +2",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.range += 3;
      scene.player.stats.attack += 2;
    },
    displayOnList: true,
  },
  {
    id: "pale_whetstone",
    name: "Pale Whetstone",
    description: "critical chance +10%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.criticalChance += 10;
    },
    displayOnList: true,
  },
  {
    id: "green_heart",
    name: "Green Heart",
    description: "heal +2",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.heal(2)
    },
    displayOnList: false,
  },
  {
    id: "big_mushroom",
    name: "Big Mushroom",
    description: "max health +1",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.maxHealth += 1;
      scene.player.heal(1);
      scene.player.scale += 0.2;
      scene.player.range += 1.9;
    },
    displayOnList: true,
  },
  {
    id: "strategy_book",
    name: "Strategy Book",
    description: "exp gain +25%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.expGain += 25;
    },
    displayOnList: true,
  },
  {
    id: "bug_boots",
    name: "Bug Boots",
    description: "speed +15% and spawn rate x90%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.speed += 12;
      scene.spawnCooldown *= 0.9;
    },
    displayOnList: true,
  },
  {
    id: "great_magnet",
    name: "Great Magnet",
    description: "item magnet +100%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.magnet += 20;
    },
    displayOnList: true,
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
    },
    displayOnList: true,
  },
  {
    id: "cracker",
    name: "Cracker",
    description: "collision damage +5",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.collisionDamage += 5;
    },
    displayOnList: true,
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
    },
    displayOnList: true,
  },
  {
    id: "black_coffee",
    name: "Black Coffee",
    description: "upgrade dash, collistion damage +20",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.dashDistance += 20;
      scene.player.stats.dashCoolDown *= 0.5;
      scene.player.stats.collisionDamage += 20;
    },
    displayOnList: true,
  },
  {
    id: "windy_fan",
    name: "Windy Fan",
    description: "upgrade shoot windy attack",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.windyAttackSize += 150;
    },
    displayOnList: true,
  },
  {
    id: "double_daggers",
    name: "Double Giant Swords",
    description: "sword +1 and range -15%",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.addSword();
      scene.player.stats.range -= 3;
      scene.player.stats.jumpCoolDown -= 125;
    },
    displayOnList: true,
  },
  {
    id: "magic_crystal",
    name: "Magic Crystal",
    description: "damage +1 and mana +20%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.attack += 1;
      scene.player.stats.mana += 20;
    },
    displayOnList: true,
  },
  {
    id: "shiny_sandclock",
    name: "Shiny Sandclock",
    description: "cooldown x80% and mana +10%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene): void => {
      scene.player.stats.coolDown = scene.player.stats.coolDown * 0.8;
      scene.player.stats.mana += 10;
    },
    displayOnList: true,
  },
]

export default itemList;