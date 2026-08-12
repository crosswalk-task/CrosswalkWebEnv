import { Car } from "./Car";
import { Roads, Road } from "../Roads";
import { Agent } from "./Agent";
import { Box, Random, isOverlapping } from "../utils";
import { CARS_PER_LANE_PAIR_COMPOSITION, CAR_CANDIDATES } from "./CarDetails";
import { CarAssets } from "./types"

export class Cars {
  agent: Agent;
  elements: Car[];
  roadUidToCarsDict: Record<number, Car[]>;

  constructor(agent: Agent, elements: Car[], roadUidToCarsDict: Record<number, Car[]>) {
    this.agent = agent;
    this.elements = elements;
    this.roadUidToCarsDict = roadUidToCarsDict;
  }

  public updatePositions(dt: number): void {
    for (const car of this.elements) {
      car.updateTarget(dt);
      car.updatePosition(dt);
    }
  }

  public render(ctx: CanvasRenderingContext2D, pixSquareSize: number, cameraGridBox: Box): void {
    for (const car of this.elements) {
      car.render(ctx, pixSquareSize, cameraGridBox);
    }
  }

  public static generateCars(
    agent: Agent,
    roads: Roads,
    mapGridBox: Box,
    stepsPerSecond: number,
    carAssets: CarAssets,
    random: Random
  ): Cars {
    const cars: Car[] = [];
    const roadUidToCarsDict: Record<number, Car[]> = {};
    let carUid = 0;

    for (const road of roads.elements) {
      roadUidToCarsDict[road.uid] = [];
      const roadHeight = road.bottomY - road.topY + 1;

      for (let i = 0; i < roadHeight; i += Road.COMPOSITION_SIZE) {
        const direction = road.directions[i];
        const carsPerLanePair = random.choice(CARS_PER_LANE_PAIR_COMPOSITION);

        for (const [jStr, carHeightTypes] of Object.entries(carsPerLanePair)) {
          const j = parseInt(jStr);
          const startRowIdx = road.topY + i + j;
          for (const height of carHeightTypes) {
            carUid += 1;
            const [carName] = random.choice(CAR_CANDIDATES[height]);
            let overlapped = false;
            for (let k = 0; k < 3; k++) {
              const initialX = random.integers(0, mapGridBox.width - 1);
              const carDetails = carAssets[carName][road.carColorType][direction];
              const newCar = new Car(
                carUid,
                initialX,
                startRowIdx,
                height,
                road,
                mapGridBox,
                stepsPerSecond,
                carDetails,
                random
              );
              if (newCar) {
                overlapped = roadUidToCarsDict[road.uid].some((sameRoadCar) => Cars._checkOverlapping(sameRoadCar, newCar!));
              }
              if (!overlapped) {
                cars.push(newCar);
                roadUidToCarsDict[road.uid].push(newCar);
                break;
              }
            }
          }
        }
      }
    }

    // build nearby_cars list
    for (let i = 0; i < cars.length; i++) {
      const curCar = cars[i];
      const [topY1, bottomY1] = curCar.getCurYPos();
      for (let j = 0; j < cars.length; j++) {
        if (i === j) continue;
        const otherCar = cars[j];
        const [topY2, bottomY2] = otherCar.getCurYPos();
        if (Math.max(topY1, topY2) <= Math.min(bottomY1, bottomY2)) {
          curCar.nearbyCars.push(otherCar);
        }
      }
    }

    return new Cars(agent, cars, roadUidToCarsDict);
  }

  private static _checkOverlapping(car1: Car, car2: Car): boolean {
    const [l1, r1] = car1.getCurXPos();
    const [t1, b1] = car1.getCurYPos();
    const [l2, r2] = car2.getCurXPos();
    const [t2, b2] = car2.getCurYPos();
    return isOverlapping(l1, r1, l2, r2) && isOverlapping(t1, b1, t2, b2);
  }

  public toString(): string {
    return this.elements.map((car) => car.toString()).join("\n");
  }
}
