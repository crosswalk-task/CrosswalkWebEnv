import { Agent } from "./gameobjects/Agent";
import { Car } from "./gameobjects/Car";
import { Cars } from "./gameobjects/Cars";
import { AssetManager } from "./gameobjects/AssetManager";
import { Roads } from "./Roads";
import { Box, Random, isOverlappingRectangles } from "./utils";

export class World {
  private static UP_REWARD_PER_UNIT = 5;
  private static BONUS_SCORE_PER_SEC = 50;

  private mapGridBox: Box;
  private stepsPerSecond: number;
  private random: Random;
  readonly agent: Agent;
  readonly roads: Roads;
  readonly cars: Cars;
  private episodeResultExtraScore: number = 0;
  public row_to_cars_dict: Record<number, Car[]> = {};
  public danger_row: boolean[];
  public crosswalk_map: boolean[][];
  private rewardPerY: number[];
  private initialHeightPadding: number = 0;

  constructor(
      agentRangeX: [number, number],
      mapGridBox: Box,
      cameraWidth: number,
      cameraHeight: number,
      stepsPerSecond: number,
      assetManager: AssetManager,
      random: Random,
    ) {
    this.mapGridBox = mapGridBox;
    this.stepsPerSecond=stepsPerSecond;
    this.random=random;

    this.agent = new Agent(agentRangeX, mapGridBox, cameraWidth, cameraHeight, stepsPerSecond, assetManager.getPlayerAssets());
    const initialAgentY = this.agent.curLocation[1];
    this.roads = new Roads(this.agent, cameraWidth, mapGridBox, this.initialHeightPadding, this.random);
    this.cars = Cars.generateCars(this.agent, this.roads, mapGridBox, stepsPerSecond, assetManager.getCarAssets(), random);

    for (const car of this.cars.elements) {
      for (const row of car.rows) {
        if (!(row in this.row_to_cars_dict)) {
          this.row_to_cars_dict[row] = [];
        }
        this.row_to_cars_dict[row].push(car);
      }
    }

    this.danger_row = Array(mapGridBox.height).fill(true);
    for (const y of this.roads.safeRowIdxList) {
      this.danger_row[y] = false; // safe
    }

    this.crosswalk_map = Array.from({ length: mapGridBox.height }, () => Array(mapGridBox.width).fill(false));
    for (const road of this.roads.elements) {
      const crosswalk = road.crosswalk;
      if (crosswalk == null) continue;
      for (let y = crosswalk.topRow; y <= crosswalk.endRow + 1; y++) {
        for (let x = crosswalk.leftEnd; x <= crosswalk.rightEnd; x++) {
          this.crosswalk_map[y][x] = true; // crosswalk
        }
      }
    }

    const rewardY: boolean[] = new Array(this.mapGridBox.height).fill(false);
    rewardY[Agent.TARGET_LANE] = true;
    this.rewardPerY = new Array(this.mapGridBox.height).fill(0);
    for (const road of this.roads.elements) {
      const roadCrossedY = road.topY - 1;
      rewardY[roadCrossedY] = true;
      const cumReward = Math.floor(this.stepsPerSecond * (initialAgentY - this.initialHeightPadding - roadCrossedY)) * World.UP_REWARD_PER_UNIT;
      this.rewardPerY[roadCrossedY] = cumReward;
    }
    for (let y = this.mapGridBox.height - 1; y > 0; y--) {
      this.rewardPerY[y - 1] = Math.max(
        this.rewardPerY[y],
        this.rewardPerY[y - 1]
      );
    }
  }

  public updatePositions(dt: number) {
    this.agent.updatePosition(dt);
    this.roads.activateCrosswalks()
    this.cars.updatePositions(dt)
  }

  public updateAgentCollision() {
    if (this.agent.isDead) return;
    const agentHitbox = this.agent.getHitbox();
    for (const car of this.cars.elements) {
      const carHitbox = car.getHitbox();
      if (isOverlappingRectangles(agentHitbox, carHitbox)) {
        this.agent.setDead();
        if (this.episodeResultExtraScore === 0) {
          this.episodeResultExtraScore = -car.carDetails.penalty;
        }
      }
    }
  }

  public updateTargetReached(timeLeftSec: number) {
    if (this.agent.isDead) return;
    const agentY = this.agent.getCurLocationGrid()[1];
    const targetLaneReached = agentY === Agent.TARGET_LANE;
    if (targetLaneReached) {
      this.episodeResultExtraScore = timeLeftSec * World.BONUS_SCORE_PER_SEC;
    }
  }

  public calculateCumCrossingRewards(): number {
    const agentY = this.agent.getCurLocationGrid()[1];
    return this.rewardPerY[agentY];
  }

  public targetLaneReached(): boolean {
    const agentY = this.agent.getCurLocationGrid()[1];
    return agentY === Agent.TARGET_LANE;
  }

  public getEpisodeResultExtraScore(): number {
    return this.episodeResultExtraScore;
  }
}
