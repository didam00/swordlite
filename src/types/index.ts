import Entity from "../entities/Entity";
import GameScene from "../scenes/GameScene";

export interface StatusEffect {
  id: string;
  duration: number;
  callback?: (entity: Entity, level: number) => void;
}

export interface Magic {
  id: string;
  cooldown: number;
  cooltime: number;
  level: number;
  effect?: (scene: GameScene, level: number) => void;
}