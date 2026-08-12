import { DirectionAction } from "../Action";
import { AgentStatus } from "./Agent";
import { CarType, CarColorType, CarDirection, CarDetails } from "./CarDetails";

export type CanvasImage = ImageBitmap | HTMLImageElement | null; // drawImage supports both
export type StatusMap<T> = Record<AgentStatus, T>;
export type DirectionMap<T> = Record<DirectionAction, T>;
export type PlayerAssetImages = DirectionMap<StatusMap<CanvasImage[]>>;
export type PlayerAssetSizes = DirectionMap<StatusMap<Array<[number, number]>>>; // [width, height] ratio

export interface PlayerAssets {
  images: PlayerAssetImages;
  sizes: PlayerAssetSizes;
}

export type CarAssets = Record<CarType, Record<CarColorType, Record<CarDirection, CarDetails>>>;
