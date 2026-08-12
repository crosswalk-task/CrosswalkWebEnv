import { Action, ACTION_DURATION, ACTION_TO_DELTA, DirectionAction } from "../Action";
import { GameObject } from "./GameObject";
import { PlayerAssets, PlayerAssetSizes } from "./types";
import { Box } from "../utils";

export enum AgentStatus {
  ALIVE = 0,
  DEAD = 1,
}

export class Agent extends GameObject {
  static TARGET_LANE = 0;

  mapGridBox: Box;
  cameraWidth: number;
  cameraHeight: number;
  isDead: boolean;
  MIN_X: number;
  MAX_X: number;
  sizes: PlayerAssetSizes;

  accDt: number;
  miniStepCount: number;
  lastAction: Action;
  lastDirection: DirectionAction;

  initPos: [number, number];

  constructor(
    agentRangeX: [number, number],
    mapGridBox: Box,
    cameraWidth: number,
    cameraHeight: number,
    stepsPerSecond: number,
    assetManager: PlayerAssets,
  ) {
    const fixed_speedBase = 2.5;
    const initPos: [number, number] = [Math.floor(mapGridBox.width / 2), mapGridBox.height - 1];
    super(fixed_speedBase, [initPos[0], initPos[1]], stepsPerSecond);

    this.initPos = initPos;
    this.mapGridBox = mapGridBox;
    this.cameraWidth = cameraWidth;
    this.cameraHeight = cameraHeight;
    this.isDead = false;
    this.MIN_X = agentRangeX[0];
    this.MAX_X = agentRangeX[1];
    this.sizes = assetManager.sizes;

    this.accDt = 0;
    this.miniStepCount = 0;
    this.lastAction = Action.NOTHING; // default action
    this.lastDirection = Action.DOWN; // default direction
  }

  public getHitbox(): [number, number, number, number] {
    const centerX = this.curLocation[0];
    const centerY = this.curLocation[1];
    const status = this.isDead ? AgentStatus.DEAD : AgentStatus.ALIVE;
    const dirFrames = ACTION_DURATION[this.lastDirection];
    const frame = this.miniStepCount % dirFrames;
    const [player_width, player_height] = this.sizes[this.lastDirection][status][frame];

    const topY = centerY - player_height / 2;
    const bottom_y = topY + player_height;
    const leftX = centerX - player_width / 2;
    const right_x = leftX + player_width;
    return [topY, bottom_y, leftX, right_x];
  }

  public getCurLocationGrid(): [number, number] {
    return [Math.round(this.curLocation[0]), Math.round(this.curLocation[1])];
  }

  public getCurLocationRounded(): [number, number] {
    return [Number(this.curLocation[0].toFixed(2)), Number(this.curLocation[1].toFixed(2))];
  }

  public getTargetY(): number {
    return Number(this.targetLocation[1].toFixed(2));
  }

  public updateTarget(action: Action) {
    if (!this.isMoving) return;
    this.accDt = 0;
    this.miniStepCount = 0;
    this.lastAction = action;
    if (action !== Action.NOTHING) {
      this.lastDirection = action;
    }
    const [dx, dy] = ACTION_TO_DELTA[action];
    const distance = (this.defaultSpeed / this.stepsPerSecond) * ACTION_DURATION[action];
    const nx = this.curLocation[0] + dx * distance;
    const ny = this.curLocation[1] + dy * distance;

    const clampedX = this.clamp(nx, this.MIN_X, this.MAX_X);
    const clampedY = this.clamp(ny, Agent.TARGET_LANE, this.mapGridBox.height - 1);

    this.targetLocation = [clampedX, clampedY];
  }

  public incrementMiniStep() {
    if (this.lastAction !== Action.NOTHING) {
      this.miniStepCount = (this.miniStepCount + 1) % 4;
    } else {
      this.miniStepCount = 0;
    }
  }

  public updatePosition(dt: number) {
    if (!this.isMoving) return;
    super.updatePosition(dt);
    if (this.lastAction !== Action.NOTHING) {
      this.accDt += dt;
    }
  }

  public setDead() {
    this.isDead = true;
    this.stop();
  }

  private clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v));
  }

  public render(ctx: CanvasRenderingContext2D, playerAssets: PlayerAssets, pixSquareSize: number) {
    const images = playerAssets.images;
    const sub_dir = (this.isDead ? AgentStatus.DEAD : AgentStatus.ALIVE);
    const dirFrames = ACTION_DURATION[this.lastDirection];
    const frame = this.miniStepCount % dirFrames;
    const image = images[this.lastDirection][sub_dir][frame];
    const [agentGridWidth, agentGridHeight] = this.sizes[this.lastDirection][sub_dir][frame];

    const topY = (this.cameraHeight/2 + 2 - agentGridHeight/2) ;
    const leftX = (this.cameraWidth/2 - agentGridWidth/2);
    if (!image) {
      console.error("player image not loaded")
      return;
    }
    ctx.drawImage(
      image,
      leftX * pixSquareSize,
      topY * pixSquareSize,
      agentGridWidth * pixSquareSize,
      agentGridHeight * pixSquareSize
    );
  }
}
