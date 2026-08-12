import { CanvasImage } from "./types"

export enum Penalty {
  LOW = 100,
  MEDIUM = 500,
  HIGH = 1000,
}

export enum CarColorType {
  GREEN = 0,
  YELLOW = 1,
  RED = 2,
}

export enum CarType {
  MICRO = "MICRO",
  JEEP = "JEEP",
  CIVIC = "CIVIC",
  VAN = "VAN",
  SUV = "SUV",
  MINIVAN = "MINIVAN",
  WAGON = "WAGON",
  HatchBack = "HatchBack",
  SPORT = "SPORT",
  COUPE = "COUPE",
  MUSCLECAR = "MUSCLECAR",
  LUXURY = "LUXURY",
  SEDAN = "SEDAN",
  SUPERCAR = "SUPERCAR",
  LIMO = "LIMO",
  CAMPER = "CAMPER",
  MEDIUMTRUCK = "MEDIUMTRUCK",
  BOXTRUCK = "BOXTRUCK",
  PICKUP = "PICKUP",
}

export enum CarHeightType {
  SMALL = 1,
  LARGE = 2,
}

export enum CarDirection {
  GO_RIGHT = "EAST",
  GO_LEFT = "WEST",
}

export interface RiskDetail {
  colorName: string;
  penalty: Penalty;
}

export const RiskDetails: Record<CarColorType, RiskDetail> = {
  [CarColorType.RED]: { colorName: "Red", penalty: Penalty.HIGH },
  [CarColorType.YELLOW]: { colorName: "Yellow", penalty: Penalty.MEDIUM },
  [CarColorType.GREEN]: { colorName: "Green", penalty: Penalty.LOW },
};

// key = start_row_idx, value = car_heights 
export const CARS_PER_LANE_PAIR_COMPOSITION: Array<Record<number, CarHeightType[]>> = [
    // 2 small cars
    {0: [CarHeightType.SMALL], 1: [CarHeightType.SMALL]}, // [CarHeightType.SMALL=CarHeightType.SMALL], 2=CarHeightType.LARGE]
    {0: [CarHeightType.SMALL], 1: [CarHeightType.SMALL]},
    // 3 small cars
    {0: [CarHeightType.SMALL], 1: [CarHeightType.SMALL, 1]},
    {0: [CarHeightType.SMALL, 1], 1: [CarHeightType.SMALL]},
    // 1 big car, 1 small car
    {0: [CarHeightType.LARGE, CarHeightType.SMALL], 1: []},
    {0: [CarHeightType.LARGE], 1: [CarHeightType.SMALL]},
    // 1 big car, 2 small cars
    {0: [CarHeightType.LARGE, CarHeightType.SMALL], 1: [CarHeightType.SMALL]},
    {0: [CarHeightType.LARGE, CarHeightType.SMALL], 1: [CarHeightType.SMALL]},
]

export const CAR_CANDIDATES: Record<CarHeightType, Array<[CarType, number]>> = {
  [CarHeightType.SMALL]: [
    [CarType.MICRO, 1.1875],
    [CarType.JEEP, 1.3043],
    [CarType.CIVIC, 1.5556],
    [CarType.VAN, 1.6136],
    [CarType.SUV, 1.8333],
    [CarType.MINIVAN, 1.907],
    [CarType.WAGON, 1.9545],
    [CarType.HatchBack, 1.975],
    [CarType.SPORT, 1.9756],
    [CarType.COUPE, 2.0238],
    [CarType.MUSCLECAR, 2.0244],
    [CarType.LUXURY, 2.0698],
    [CarType.SEDAN, 2.075],
    [CarType.SUPERCAR, 2.2895],
    [CarType.LIMO, 3.225],
  ],
  [CarHeightType.LARGE]: [
    [CarType.CAMPER, 1.8868],
    [CarType.MEDIUMTRUCK, 1.8983],
    [CarType.BOXTRUCK, 2.06],
    [CarType.PICKUP, 2.125],
  ],
};

// car_details_dict[car_type][color_type][go_right]
export type CarAssets = Record<CarType, Record<CarColorType, Record<CarDirection, CarDetails>>>;

export class CarDetails {
  public readonly carType: CarType;
  public readonly colorType: CarColorType;
  public readonly penalty: Penalty;
  public readonly goRight: boolean;

  public readonly gridWidth: number;
  public readonly gridHeight: number;
  public readonly widthPx: number;
  public readonly heightPx: number;

  public readonly image: CanvasImage;

  constructor(
    carType: CarType,
    colorType: CarColorType,
    direction: CarDirection,
    gridWidth: number,
    gridHeight: number,
    widthPx: number,
    heightPx: number,
    image: CanvasImage,
  ) {
    this.carType = carType;
    this.colorType = colorType;
    const risk = RiskDetails[colorType];
    this.penalty = risk.penalty;
    this.goRight = direction === CarDirection.GO_RIGHT

    this.gridWidth = gridWidth; 
    this.gridHeight = gridHeight; 
    this.widthPx = widthPx; 
    this.heightPx = heightPx; 

    this.image = image;
  }
}

export const getMaxCarGridWidth = (): number => {
    let max_width = 0;
    for (const height of [CarHeightType.SMALL, CarHeightType.LARGE] as const) {
      for (const carCandidate of CAR_CANDIDATES[height]) {
        const ratio = carCandidate[1];
        max_width = Math.max(max_width, ratio * height)
      }
    }
    return max_width;
}
