import { GameObject } from "./GameObject";
import { Road, CrossWalk } from "../Roads";
import { Box, Random, isOverlapping } from "../utils";
import { CarDetails } from "./CarDetails";

export class Car extends GameObject {

  public static CAR_SPEEDS = [3.0, 3.5, 4.0, 4.5]; // slightly faster than player

  public readonly uid: number;
  public readonly rows: number[];
  private readonly mapGridBox: Box;
  public readonly carDetails: CarDetails;
  public readonly random: Random;
  public readonly road: Road;
  public readonly nearbyCars: Car[];

  constructor(
    uid: number,
    initialX: number,
    startRowIdx: number,
    carGridHeight: number,
    road: Road,
    mapGridBox: Box,
    stepsPerSecond: number,
    carDetails: CarDetails,
    random: Random
  ) {
    const rowIndices = Array.from({ length: carGridHeight }, (_, i) => startRowIdx + i);
    const initialY = rowIndices.reduce((a, b) => a + b, 0) / rowIndices.length;
    const curLocation: [number, number] = [initialX, initialY];

    super(0, curLocation, stepsPerSecond);
    this.uid = uid;
    this.rows = rowIndices;
    this.mapGridBox = mapGridBox;
    this.carDetails = carDetails;
    this.random = random;
    this.setRandomSpeed();
    this.road = road;
    this.nearbyCars = [];
  }

  public getCurSpeed(): number {
    return this.isMoving ? this.defaultSpeed : 0;
  }

  public getHitbox(): [number, number, number, number] {
    const [leftX, rightX] = this.getCurXPos();
    const [topY, bottomY] = this.getCurYPos();
    return [topY, bottomY, leftX, rightX];
  }

  public getCurXPos(): [number, number] {
    const halfWidth = this.carDetails.gridWidth / 2;
    return [this.curLocation[0] - halfWidth, this.curLocation[0] + halfWidth];
  }

  public getCurYPos(): [number, number] {
    const halfHeight = this.carDetails.gridHeight / 2;
    return [this.curLocation[1] - halfHeight, this.curLocation[1] + halfHeight];
  }

  public setRandomSpeed(): void {
    const speed = this.random.choice(Car.CAR_SPEEDS);
    this.defaultSpeed = this.carDetails.goRight ? speed : -speed;
  }

  public restartIfNeeded(): void {
    if (this.carDetails.goRight && this.curLocation[0] >= this.mapGridBox.width) {
      this.curLocation[0] = 0;
      this.setRandomSpeed();
    }
    if (!this.carDetails.goRight && this.curLocation[0] <= 0) {
      this.curLocation[0] = this.mapGridBox.width - 1;
      this.setRandomSpeed();
    }
  }

  public updateTarget(dt: number): void {
    this.restartIfNeeded();

    if (this.nearbyCars.length > 0) {
      const threshold = 0.1;
      const [myLeft, myRight] = this.getCurXPos();

      for (const otherCar of this.nearbyCars) {
        const [otherLeft, otherRight] = otherCar.getCurXPos();

        // stop when another car is right in front
        const frontDist = this.carDetails.goRight ? otherLeft - myRight : myLeft - otherRight;
        if (0 < frontDist && frontDist <= threshold) {
          this.stop();
          return;
        }

        // overlapping case: stop the one behind (or smaller uid if equal)
        const frontDiff = this.carDetails.goRight
          ? otherRight - myRight
          : myLeft - otherLeft;

        if (frontDiff > 0 || (frontDiff === 0 && this.uid < otherCar.uid)) {
          if (isOverlapping(myLeft, myRight, otherLeft, otherRight)) {
            this.stop();
            return;
          }
        }
      }
    }

    // stop before active crosswalk
    const crosswalk = this.road.crosswalk;
    if (crosswalk && crosswalk.isActive) {
      const [carLeft, carRight] = this.getCurXPos();
      const [cwLeft, cwRight] = crosswalk.getActivationRangeX();

      const frontDist = this.carDetails.goRight
        ? Math.abs(cwLeft - carRight)
        : Math.abs(cwRight - carLeft);

      if (frontDist < CrossWalk.THRESHOLD_DISTANCE) {
        if (!isOverlapping(carLeft, carRight, cwLeft, cwRight)) {
          this.stop();
          return;
        }
      }
    }

    this.targetLocation[0] = this.curLocation[0] + (this.defaultSpeed * dt) / 1000;
    this.isMoving = true;
  }

  public render(ctx: CanvasRenderingContext2D, pixSquareSize: number, cameraGridBox: Box): void {
    if (!this.carDetails.image) {
      console.error("car image not loaded")
      return;
    }

    const adjustment = 0.5;
    const renderGridLeft = Math.max(0, this.mapGridBox.left - cameraGridBox.left) - adjustment;
    const renderGridRight = (cameraGridBox.width) + Math.min(2, this.mapGridBox.right - cameraGridBox.right + adjustment);

    const [carLeft, carRight] = this.getCurXPos();
    const [carTop, carBottom] = this.getCurYPos();

    const carGridTop = carTop - cameraGridBox.top;
    const carGridLeft = carLeft - cameraGridBox.left;
    const carGridRight = carRight - cameraGridBox.left;

    if (carGridRight <= renderGridLeft) return;
    if (renderGridRight <= carGridLeft) return;

    if (cameraGridBox.top - adjustment <= carBottom && carTop <= cameraGridBox.bottom + adjustment + 1) {
      const carLeftXPx = carGridLeft * pixSquareSize;
      const carTopYPx = carGridTop * pixSquareSize;
      ctx.drawImage(
        this.carDetails.image,
        carLeftXPx,
        carTopYPx,
        (carRight - carLeft) * pixSquareSize,
        (carBottom - carTop) * pixSquareSize,
      );
    }
  }

  public toString(): string {
    return `Car(cur_pos=(${this.curLocation[0]}, ${this.curLocation[1]}), crosswalk=(${this.road.crosswalk}))`;
  }
}
