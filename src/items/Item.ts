import GameScene from "../scenes/GameScene";
import itemList, { ItemDefinition } from "./ItemList";

export abstract class Item extends Phaser.Physics.Arcade.Sprite {
  id: string = "";
  itemData: ItemDefinition = null!;
  scene: GameScene = null!;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter = null!;

  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(scene, x, y, "items", `${item.id}-0`);
    this.scene = scene;

    this.itemData = item;
    this.id = item.id;
    
    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.setOrigin(0.5, 0.5);
    this.setSize(2, 2);
    this.setVelocityX(- scene.player.speed);

    scene.physics.add.overlap(
      scene.player,
      this,
      () => {
        scene.player.collectItem(this);
      },
      undefined,
      scene
    )

    let spreadSpeed = 15;
    let quantity = 4;
    let alpha = 1;
    let scale = 3;
    let color = [0xffffff, 0xc1d9f2, 0x909edd];
    if (item.type === "soul") {
      quantity = 8;
      spreadSpeed = 24;
      color = [0xffffff];
    } else if (item.rarity === "epic") {
      spreadSpeed = 20;
      quantity = 24;
      color = [0x8c51cc, 0xb991f2, 0xffffff];
    } else if (item.rarity === "unique") {
      spreadSpeed = 25;
      quantity = 48;
      color = [0xd83895, 0xffffff, 0xd83843];
    }
    this.emitter = scene.add.particles(0, 0, 'rect-particle', {
      x: 0,
      y: 0,
      follow: this,
      lifespan: {min: 450, max: 750},
      // speedX: { min: this.body!.velocity.x - spreadSpeed, max: this.body!.velocity.x + spreadSpeed }, // -50
      speedX: () => {
        return Phaser.Math.Between(this.body!.velocity.x - spreadSpeed, this.body!.velocity.x + spreadSpeed);
      },
      speedY: () => {
        return Phaser.Math.Between(this.body!.velocity.y - spreadSpeed, this.body!.velocity.y + spreadSpeed);
      },
      scale: { start: scale, end: 0 },
      alpha: alpha,
      quantity: quantity,
      frequency: 50,
      // blendMode: 'ADD',
      tint: color,
      followOffset: { x: -1, y: -1 },
    });

    scene.layers.bottom.add(this.emitter);
    scene.layers.item.add(this);
  }

  onCollect(): void {
    this.remove();
  };
  
  update(): void {
    
  };
  
  remove(): void {
    const emitter = this.emitter;
    emitter.stop();
    this.destroy();
  }
}

export class NormalItem extends Item {
  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(item, x, y, scene);
  }

  onCollect(): void {
    this.itemData.effect(this.scene);
    super.onCollect();
  }
}

export class CursedItem extends Item {
  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(item, x, y, scene);

    this.setTint(0xff6866);
  }

  onCollect(): void {
    this.itemData.effect(this.scene);
    this.destroy();
  }
}

export class WeaponItem extends Item {
  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(item, x, y, scene);
  }

  onCollect(): void {
    this.scene.player.addWeapon(this.itemData.id);
    super.onCollect();
  }
}

export class MagicCrystal extends Item {
  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(item, x, y, scene);
  }

  onCollect(): void {
    this.scene.player.addMagic(this);
    super.onCollect();
  }
}

export function createItem(id: string, x: number, y: number, scene: GameScene, isCursed: boolean = false): Item | null {
  const item = itemList.find(item => item.id === id)!;
  let itemEntity: null | Item = null;

  if (!item) {
    throw new Error(`${id}을 찾을 수 없습니다!`);
  }

  const params: [
    ItemDefinition, number, number, GameScene
  ] = [item, x, y, scene];

  if (isCursed) {
    itemEntity = new CursedItem(...params);
  } else {
    switch (item.type) {
      case "weapon": itemEntity = new WeaponItem(...params); break;
      case "magic": itemEntity = new MagicCrystal(...params); break;
      default: itemEntity = new NormalItem(...params); break;
    }
  }

  return itemEntity
}