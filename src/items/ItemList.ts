import Enemy from "../entities/Enemy";
import GameScene from "../scenes/GameScene";

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "epic" | "unique" | "none";
  effect: (scene: GameScene, data?: number) => void;
  type: "normal" | "magic" | "weapon" | "soul";
  cooldown?: number;
  cooldownForLevel?: number;
  displayOnList: boolean;
}

const itemList: ItemDefinition[] = [
  {
    id: "giant_sword",
    name: "Giant Sword",
    description: "range +22% and true attack +5",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.range += 4;
      scene.player.stats.trueAttack += 5;
    },
    displayOnList: true,
  },
  {
    id: "pale_whetstone",
    name: "Pale Whetstone",
    description: "all damage +3 and critical damage +12%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.stats.damage += 3;
      scene.player.stats.criticalDamage += 0.12;
    },
    displayOnList: true,
  },
  {
    id: "black_cloak",
    name: "Black Cloak",
    description: "critical chance +10% and critical damage +20%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.stats.criticalChance += 10;
      scene.player.stats.criticalDamage += 0.2;
    },
    displayOnList: true,
  },
  {
    id: "shadow_water",
    name: "Shadow Water",
    description: "all damage +5",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.damage += 5;
    },
    displayOnList: true,
  },
  {
    id: "green_heart",
    name: "Green Heart",
    description: "heal +2",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.heal(2)
    },
    displayOnList: false,
  },
  // {
  //   id: "sugar_cube",
  //   name: "Sugar Cube",
  //   description: "immune time +0.5s and exp gain +8%",
  //   rarity: "common",
  //   type: "normal",
  //   effect: (scene: GameScene, data: number = 1): void => {
  //     scene.player.stats.immuneTime += 500;
  //     scene.player.stats.expGain += 8;
  //   },
  //   displayOnList: true,
  // },
  // {
  //   id: "cracker",
  //   name: "Cracker",
  //   description: "health +1 and collision damage +10",
  //   rarity: "common",
  //   type: "normal",
  //   effect: (scene: GameScene, data: number = 1): void => {
  //     scene.player.heal(1);
  //     scene.player.stats.collisionDamage += 10;
  //   },
  //   displayOnList: true,
  // },
  {
    id: "black_pearl",
    name: "Black Pearl",
    description: "mana +25% and all damage +3",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.stats.mana += 25;
      scene.player.stats.damage += 3;
    },
    displayOnList: true,
  },
  {
    id: "great_magnet",
    name: "Great Magnet",
    description: "magnet range +50%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.stats.magnet += 10;
    },
    displayOnList: true,
  },
  {
    id: "big_mushroom",
    name: "Big Mushroom",
    description: "max health +1 and size +20%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.maxHealth += 1;
      scene.player.heal(1);
      scene.player.changeScale(scene.player.scale + 0.2);
    },
    displayOnList: true,
  },
  {
    id: "strategy_book",
    name: "Strategy Book",
    description: "exp gain +20% and magic damage +5",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.stats.expGain += 20;
      scene.player.stats.magicDamage += 5;
    },
    displayOnList: true,
  },
  {
    id: "bug_boots",
    name: "Bug Boots",
    description: "speed +15% and spawn rate x80%",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.stats.speed += 9;
      scene.spawnCooldown *= 0.8;
    },
    displayOnList: true,
  },
  {
    id: "black_coffee",
    name: "Black Coffee",
    description: "upgrade dash",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
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
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.stats.windyAttackSize += 200;
    },
    displayOnList: true,
  },
  {
    id: "ninja_banana",
    name: "Ninja Banana",
    description: "parry when jump or dash",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      
    },
    displayOnList: true,
  },
  {
    id: "portable_mirror",
    name: "Portable Mirror",
    description: "change bullets to light magic",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      
    },
    displayOnList: true,
  },
  {
    id: "soul_candle",
    name: "Soul Candle",
    description: "enemies drop souls",
    rarity: "none",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      
    },
    displayOnList: true,
  },
  {
    id: "soul_of_power",
    name: "Soul of Power",
    description: "damage nearby enemies",
    rarity: "none",
    type: "soul",
    effect: (scene: GameScene, data: number = 1): void => {
      const bomb = scene.add.sprite(scene.player.x, scene.player.y, "effects", "soul_boom-0").play("soul_boom");
      scene.physics.world.enable(bomb);
      // bomb.setOrigin(0.5, 0.5);
      const body = bomb.body as Phaser.Physics.Arcade.Body;
      body.setCircle(70);
      body.setOffset(-60, -60);
      bomb.setScale(1 + scene.player.stats.mana / 100)
      // scene.cameras.main.flash(250, 255, 255, 255);
      body.setVelocityX(-scene.player.speed);

      for (const enemy of scene.enemies) {
        if (scene.physics.world.overlap(enemy.body!, body)) {
          enemy.takeDamage(scene.player.damage * 0.5);
          enemy.takeStun(500 * (1 + scene.player.stats.mana / 100));
          // const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
          // enemy.vx = Math.cos(angle) * 200
          // enemy.vy = Math.sin(angle) * 200
          // enemy.setVelocity(
          //   Math.cos(angle) * 200,
          //   Math.sin(angle) * 200
          // );
        }
      }

      scene.time.delayedCall(250, () => {
        bomb.destroy();
      });
    },
    displayOnList: false,
  },
  {
    id: "soul_of_life",
    name: "Soul of Life",
    description: "health +1",
    rarity: "none",
    type: "soul",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.heal(1);
    },
    displayOnList: false,
  },
  {
    id: "soul_of_knowledge",
    name: "Soul of Knowledge",
    description: "exp +20%",
    rarity: "none",
    type: "soul",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.exp += 20;
    },
    displayOnList: false,
  },
  // {
  //   id: "rusty_shield",
  //   name: "Rusty Shield",
  //   description: "parry bullets",
  //   rarity: "epic",
  //   type: "normal",
  //   effect: (scene: GameScene, data: number = 1): void => {
  //     scene.player.stats.criticalChance -= 100;
  //   },
  //   displayOnList: true,
  // },
  // {
  //   id: "double_daggers",
  //   name: "Double Giant Swords",
  //   description: "sword +1 and range -15%",
  //   rarity: "epic",
  //   type: "normal",
  //   effect: (scene: GameScene, data: number = 1): void => {
  //     scene.player.addSword();
  //     scene.player.range -= 3;
  //     scene.player.stats.jumpCoolDown -= 125;
  //   },
  //   displayOnList: true,
  // },
  {
    id: "shiny_sandclock",
    name: "Shiny Sandclock",
    description: "cooldown -20% and mana +15",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.player.stats.coolDown = scene.player.stats.coolDown * 0.8;
      scene.player.stats.mana += 15;
    },
    displayOnList: true,
  },
  {
    id: "conquest_flag",
    name: "Conquest Flag",
    description: "when kill, near enemies get fleed",
    rarity: "none",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      
    },
    displayOnList: true,
  },
  {
    id: "lightning_rod",
    name: "Lightning Rod",
    description: "when attack, damage near enemies",
    rarity: "epic",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      
    },
    displayOnList: true,
  },
    {
    id: "sugar_cube",
    name: "Sugar Cube",
    description: "all chance up!",
    rarity: "common",
    type: "normal",
    effect: (scene: GameScene, data: number = 1): void => {
      // scene.player.stats.evade += (100 - scene.player.stats.evade) * 0.025;
      scene.player.stats.criticalChance += 5;
      scene.player.stats.luck += 20;
    },
    displayOnList: true,
  },
  {
    id: "copper_sword",
    name: "Copper Sword",
    description: "another sword",
    rarity: "epic",
    type: "weapon",
    effect: (scene: GameScene, data: number = 1): void => {

    },
    displayOnList: true,
  },
  // {
  //   id: "pickaxe",
  //   name: "Pickaxe",
  //   description: "what is this?",
  //   rarity: "epic",
  //   type: "weapon",
  //   effect: (scene: GameScene, data: number = 1): void => {

  //   },
  //   displayOnList: true,
  // },
  {
    id: "boomerang",
    name: "Boomerang",
    description: "throw boomerang when jump",
    rarity: "epic",
    type: "weapon",
    effect: (scene: GameScene, data: number = 1): void => {
      
    },
    displayOnList: true,
  },
  {
    id: "flame_book",
    name: "Flame Book",
    description: "magic.throw fireball",
    rarity: "epic",
    type: "magic",
    cooldown: 5000,
    cooldownForLevel: 0.2,
    effect: (scene: GameScene, data: number = 1): void => {
      const player = scene.player;
      const fireball = scene.add.sprite(
        player.x, 
        player.y, 
        "effects", 
        "fireball-0"
      ).play("fireball_spawn");

      scene.physics.world.enable(fireball);
      const body = fireball.body as Phaser.Physics.Arcade.Body;
      body.setSize(6, 6);
      fireball.setScale((1 + (player.stats.mana / 200)));

      const randomAngle = Math.PI * Math.random() * 2;
      fireball.setPosition(
        player.x + Math.cos(randomAngle) * (16 + player.scale * 16),
        player.y + Math.sin(randomAngle) * (16 + player.scale * 16)
      )
      scene.layers.effect.add(fireball);
      const speed = 600;

      scene.time.delayedCall(125, () => {
        if (!fireball) return;

        if (scene.enemies.length === 0) {
          body.setVelocityX(speed - player.speed);
        } else {
          const enemy: Enemy = Phaser.Utils.Array.GetRandom(scene.enemies);

          const angle = Phaser.Math.Angle.Between(fireball.x, fireball.y, enemy.x, enemy.y);
          body.setVelocity(
            Math.cos(angle) * speed - player.speed,
            Math.sin(angle) * speed
          );

          fireball.setRotation(angle + Math.PI / 2);
        }
        
        fireball.play("fireball_shoot");

        const emitter = scene.add.particles(0, 0, 'rect-particle', {
          x: 0,
          y: 0,
          follow: fireball,
          lifespan: { min: 250, max: 1000 },
          // speedX: { min: -20, max: 20 },
          // speedY: () => {
          //   return Phaser.Math.Between(this.body!.velocity.y - 20, this.body!.velocity.y + 20);
          // },
          speed: { min: 10, max: 20 },
          scale: { start: 2, end: 0 },
          alpha: 1,
          quantity: 4,
          frequency: 10,
          // blendMode: 'ADD',
          tint: [0xd83843, 0xff965f, 0xffe091],
        });
        scene.layers.bottom.add(emitter);

        scene.physics.add.collider(fireball, scene.enemies, (fireball, enemy) => {
          (enemy as Enemy).takeDamage((player.damage + player.stats.magicDamage) * (.5 + data * 0.25), false, ["fire", "magic"]);
          
          const fireballBoom = scene.add.sprite(body.x, body.y, "effects", "fireball_boom-0").play("fireball_boom");
          fireballBoom.setScale(0.5 + player.stats.mana / 200);
          
          scene.enemies.forEach((enemy) => {
            const dist = Phaser.Math.Distance.Between(body.x, body.y, enemy.x, enemy.y);
            if (dist < 50 * (1 + (player.stats.mana / 200))) {
              (enemy as Enemy).takeDamage((player.damage + player.stats.magicDamage) * (.5 + data * 0.25));
            }
          });
  
          fireball.destroy();
          emitter.stop();
          scene.time.delayedCall(1000, () => {
            emitter.destroy();
          })
  
          scene.time.delayedCall(250, () => {
            fireballBoom.destroy();
          })
        });
      })
    },
    displayOnList: true,
  },
  {
    id: "lightning_book",
    name: "Lightning Book",
    description: "damage and stun nearby enemies",
    rarity: "epic",
    cooldown: 1500,
    cooldownForLevel: 0.25,
    type: "magic",
    effect: (scene: GameScene, data: number = 1): void => {
      scene.enemies.forEach((enemy) => {
        const dist = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, enemy.x, enemy.y);
        if (dist < (50 + data * 10) * (1 + (scene.player.stats.mana / 100))) {
          (enemy as Enemy).takeDamage((scene.player.damage + scene.player.stats.magicDamage) / 2, false, ["magic", "lightning"]);
          if (Math.random() < 0.5 * (scene.player.stats.luck / 100)) {
            (enemy as Enemy).takeStun(250 * (data + 1));
          }
          
          const lightning = scene.add.sprite(scene.player.x, scene.player.y, "effects", "lightning-0").play("lightning");
          lightning.displayHeight = dist;
          lightning.setOrigin(0.5, 1);
          lightning.setRotation(Phaser.Math.Angle.Between(scene.player.x, scene.player.y, enemy.x, enemy.y) + Math.PI / 2);
          scene.layers.bottom.add(lightning);
          scene.time.delayedCall(150, () => {
            lightning.destroy();
          })
        }
      });
    },
    displayOnList: true,
  },
]

export default itemList;