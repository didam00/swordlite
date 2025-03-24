import GameScene from "../scenes/GameScene";
import itemList, { ItemDefinition } from "./ItemList";

export abstract class Item extends Phaser.Physics.Arcade.Sprite {
  id: string = "";
  item: ItemDefinition = null!;
  scene: GameScene = null!;

  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(scene, x, y, "items", `${item.id}-0`);
    this.scene = scene;

    this.item = item;
    this.id = item.id;
    
    scene.add.existing(this);
  }

  onCollect(): void {

  };

  update(): void {

  };
}

class NormalItem extends Item {
  constructor(item: ItemDefinition, x: number, y: number, scene: GameScene) {
    super(item, x, y, scene);
  }

  onCollect(): void {
    this.item.effect(this.scene);
    console.log("아이템 효과 발동!");
    this.destroy();
  }
}

export function createItem(id: string, x: number, y: number, scene: GameScene): Item | null {
  const item = itemList.find(item => item.id === id)!;
  let itemEntity: null | Item = null;

  if (!item) {
    throw new Error(`${id}을 찾을 수 없습니다!`);
  }

  switch (item.type) {
    case "normal":
      itemEntity = new NormalItem(item, x, y, scene);
      break;
    default:
      throw new Error(`알 수 없는 아이템 타입입니다: ${item.type}`);
  }

  return itemEntity
}