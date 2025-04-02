import GameScene from "../scenes/GameScene";
import itemList, { ItemDefinition } from "./ItemList";

export abstract class Item extends Phaser.Physics.Arcade.Sprite {
  id: string = "";
  itemData: ItemDefinition = null!;
  scene: GameScene = null!;

  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(scene, x, y, "items", `${item.id}-0`);
    this.scene = scene;

    this.itemData = item;
    this.id = item.id;
    
    scene.add.existing(this);
  }

  onCollect(): void {
    this.destroy();
  };

  update(): void {

  };
}

class NormalItem extends Item {
  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(item, x, y, scene);
  }

  onCollect(): void {
    this.itemData.effect(this.scene);
    this.destroy();
  }
}

class CursedItem extends Item {
  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(item, x, y, scene);
  }

  onCollect(): void {
    this.itemData.effect(this.scene);
    this.itemData.effect(this.scene);
    this.destroy();
  }
}

export function createItem(id: string, x: number, y: number, scene: GameScene): Item | null {
  const item = itemList.find(item => item.id === id)!;
  let itemEntity: null | Item = null;

  if (!item) {
    throw new Error(`${id}을 찾을 수 없습니다!`);
  }

  itemEntity = new NormalItem(item, x, y, scene);

  // switch (item.type) {
  //   case "normal":
  //     itemEntity = new NormalItem(item, x, y, scene);
  //     break;
  //   case "magic":
  //     itemEntity = new MagicItem(item, x, y, scene);
  //     break;
  //   default:
  //     throw new Error(`알 수 없는 아이템 타입입니다: ${item.type}`);
  // }

  return itemEntity
}