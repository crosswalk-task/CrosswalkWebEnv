import { World } from "./World";
import { Road } from "./Roads";
import { AssetManager } from "./gameobjects/AssetManager";
import { Agent } from "./gameobjects/Agent";
import { Car } from "./gameobjects/Car";
import { Penalty, getMaxCarGridWidth } from "./gameobjects/CarDetails";
import { Action, ACTION_DURATION, ACTION_TO_DELTA } from "./Action";
import { Random, Box, isOverlapping, isOverlappingRectangles } from "./utils";
import { theme } from "../styles/theme";
import { EPISODE_DURATION_MS, GAME_OVER_SCREEN_MS } from "../constants";

interface iEpisodeState {
  obs: number[];
  playInfo: object;
  episodeMetadata: object;
}

export class Environment {
  static MAP_GRID_WIDTH: number = 25;
  static MAP_GRID_HEIGHT: number = 25;
  static CAMERA_WIDTH: number = 11;
  static CAMERA_HEIGHT: number = 7;

  private debug = true;

  private mapGridBox: Box = new Box(0, 0, Environment.MAP_GRID_WIDTH, Environment.MAP_GRID_HEIGHT);
  // The size of a single grid square in pixels
  private pixSquareSize: number;
  private cameraWidthPixel: number;
  private cameraHeightPixel: number;

  private stepsPerSecond: number = 10;
  private stepMs: number = 1000 / this.stepsPerSecond;

  private timeLeftMs: number = EPISODE_DURATION_MS / 1000;
  private cur_episode_rewards: number = 0;

  private world: World | null;
  private state: iEpisodeState;
  private prev_road: Road | null = null;
  private target_road: Road | null = null;
  private target_road_crosswalk_visible = false;  
  private maxCarPenalty: number = Penalty.HIGH;
  private maxCarSpeed: number = Math.max(...Car.CAR_SPEEDS);
  private maxCarWidth: number = getMaxCarGridWidth();
  private agentRangeX: [number, number];
  private episodeSeed: number = 42;

  private assetManager!: AssetManager;
  private canvasRef: React.RefObject<HTMLCanvasElement>;
  private episodeOver: boolean = false;

  private constructor(canvasRef: React.RefObject<HTMLCanvasElement>, viewportWidth: number, viewportHeight: number) {
    const { pixSquareSize, cameraWidthPixel, cameraHeightPixel } = Environment.calculateSize(viewportWidth, viewportHeight);
    this.pixSquareSize = pixSquareSize;

    this.cameraWidthPixel = cameraWidthPixel;
    this.cameraHeightPixel = cameraHeightPixel;

    const agentHorizontalBuffer = 2 + Math.floor(Math.max(this.maxCarWidth, Environment.CAMERA_WIDTH)/2);
    const agentMinX = agentHorizontalBuffer;
    const agentMaxX = Environment.MAP_GRID_WIDTH - 1 - agentHorizontalBuffer;
    this.agentRangeX = [agentMinX, agentMaxX];

    this.world = null;
    this.state = { obs: [], playInfo: {}, episodeMetadata: {} };
    this.canvasRef = canvasRef;
  }

  // NOTE: constructor can not be async
  static async create(canvasRef: React.RefObject<HTMLCanvasElement>, viewportWidth: number, viewportHeight: number) {
    const env = new Environment(canvasRef, viewportWidth, viewportHeight);
    env.assetManager = await AssetManager.create();
    return env;
  }

  public updateBrowserResizing(viewportWidth: number, viewportHeight: number) {
    const { pixSquareSize, cameraWidthPixel, cameraHeightPixel } = Environment.calculateSize(viewportWidth, viewportHeight);
    this.pixSquareSize = pixSquareSize;
    this.cameraWidthPixel = cameraWidthPixel;
    this.cameraHeightPixel = cameraHeightPixel;
  }

  private static calculateSize(viewportWidth: number, viewportHeight: number) {
    viewportWidth -= 30; // padding-left + padding-right
    viewportHeight -= 60 + 15 + 15; // time panel + score panel + padding-top + padding-bottom
    const pixSquareSize = Math.floor(Math.min(viewportWidth / Environment.CAMERA_WIDTH, viewportHeight / Environment.CAMERA_HEIGHT));
    const cameraWidthPixel = Environment.CAMERA_WIDTH * pixSquareSize;
    const cameraHeightPixel = Environment.CAMERA_HEIGHT * pixSquareSize;
    return { pixSquareSize, cameraWidthPixel, cameraHeightPixel };
  }

  public getEpisodeSeed = (): number => {
    return this.episodeSeed;
  }

  public setEpisodeSeed = (seed: number) => {
    this.episodeSeed = seed;
  }

  public reset = (): object => {
    this.episodeSeed += 1;
    this.timeLeftMs = EPISODE_DURATION_MS;
    this.world = new World(
      this.agentRangeX,
      this.mapGridBox,
      Environment.CAMERA_WIDTH,
      Environment.CAMERA_HEIGHT,
      this.stepsPerSecond,
      this.assetManager,
      new Random(this.episodeSeed),
    );
    this.cur_episode_rewards = 0;
    this.state = { obs: [], playInfo: [], episodeMetadata: {} };
    this.resetEpisodeMetadata();
    return this.state.episodeMetadata;
  }

  public getMiniStepMs = (): number => {
    return this.stepMs;
  }

  public updateEveryMiniStep = (timeLeftMs: number) => {
    if (!this.episodeOver) {
      this.timeLeftMs = timeLeftMs;
      this.world?.agent.incrementMiniStep();
    }
    this.world?.updateAgentCollision();
  }

  public getEpisodeOver(): boolean {
    return this.episodeOver;
  }

  public setEpisodeOver(episodeOver: boolean) {
    this.episodeOver = episodeOver;
    if (episodeOver) {
      this.world?.agent.stop();
    }
  }

  public getCanvasRef(): React.RefObject<HTMLCanvasElement> {
    return this.canvasRef;
  }

  public getPrevActionResult(): { cumRewards: number, episodeResult: number, timeLeftSec: number } {
    if (!this.world) return { cumRewards: 0, episodeResult: 0, timeLeftSec: 0 };
    const cumRewards = this.world.calculateCumCrossingRewards();
    const resultExtraScore = this.world.getEpisodeResultExtraScore();
    this.cur_episode_rewards = cumRewards + resultExtraScore;
    return {
      cumRewards: this.cur_episode_rewards,
      episodeResult: this.world.getEpisodeResultExtraScore(),
      timeLeftSec: Math.floor(this.timeLeftMs / 1000),
    };
  }

  public updateTargetReached(timeLeftSec: number): boolean {
    if (!this.world) return false;
    this.world.updateTargetReached(timeLeftSec);
    const targetReached = this.world.getEpisodeResultExtraScore() !== 0;
    return targetReached;
  }

  public triggerAction(action: Action): number {
    if (!this.world) return 0;
    if (this.episodeOver) {
      action = Action.NOTHING; // ignore actions after episode ended
    }
    this.world.agent.updateTarget(action);
    return this.stepMs * (ACTION_DURATION[action] + 1); // NOTE: extra latency for human perception + increased time overs
  }

  // apply_time_and_render
  public updatePosition(dt: number) {
    if (!this.world) return;
    this.world.updatePositions(dt);
  }

  public getEpisodeResultExtraScore(): number {
    return this.world?.getEpisodeResultExtraScore() || 0;
  }

  public render() {
    if (!this.canvasRef.current?.getContext("2d")) return;
    const canvas: HTMLCanvasElement = this.canvasRef.current!;
    let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.canvas.width = this.cameraWidthPixel;
    ctx.canvas.height = this.cameraHeightPixel;

    if (!this.world) return;
    // const adjustment = 0.5 * this.pixSquareSize;
    const [agentCenterGridX, agentCenterGridY] = this.world.agent.curLocation;

    const cameraGridTop = agentCenterGridY - (Environment.CAMERA_HEIGHT/2) - 2;
    const cameraGridLeft = agentCenterGridX - (Environment.CAMERA_WIDTH/2);
    const cameraGridRight = cameraGridLeft + Environment.CAMERA_WIDTH - 1;
    const cameraGridBox: Box = new Box(cameraGridTop, cameraGridLeft, cameraGridRight - cameraGridLeft, Environment.CAMERA_HEIGHT - 1);

    // Default Background
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // render objects
    this.world.roads.render(ctx, this.pixSquareSize, cameraGridBox);
    this.world.agent.render(ctx, this.assetManager.getPlayerAssets(), this.pixSquareSize)
    this.world.cars.render(ctx, this.pixSquareSize, cameraGridBox)

    const [agentMinX, agentMaxX] = this.agentRangeX;
    const gridMovableRangeLeftEnd = agentMinX - cameraGridLeft - 0.5;
    const gridMovableRangeRightEnd = cameraGridRight - agentMaxX + 0.5;

    if (gridMovableRangeLeftEnd >= 0) {
      ctx.fillStyle = theme.blackOutBackgroundColor;
      ctx.fillRect(0, 0, gridMovableRangeLeftEnd * this.pixSquareSize, ctx.canvas.height);
    }
    if (gridMovableRangeRightEnd <= cameraGridRight) {
      const coverWidth = gridMovableRangeRightEnd * this.pixSquareSize;
      ctx.fillStyle = theme.blackOutBackgroundColor;
      ctx.fillRect(ctx.canvas.width - coverWidth, 0, coverWidth, ctx.canvas.height);
    }
  }

  public updateAndGetState(): { obs: number[], playInfo: Object } {
    this.updateObs();
    this.updateInfo();
    return { obs: this.state.obs, playInfo: this.state.playInfo };
  }

  private updateObs() {
    // Observation space: [0 ~ 112]
    // - Observations have boolean(0/1) values at indices: 5, 6, 7, 8, 9, 10, 11, 12, 13, 33, 34, 35, 36, 37, 38, 39, 40.
    // - All the other observations are scaled within 0 ~ 1 range.
    const obs: number[] = [];
    const [agent_x, agent_y] = this.world!!.agent.getCurLocationGrid();
    const agentHitbox = this.world!!.agent.getHitbox();
    const agent_left_x = agentHitbox[2];
    const agent_right_x = agentHitbox[3];
    const agent_width = agent_right_x - agent_left_x;
    const agent_y_range = [0, Environment.MAP_GRID_HEIGHT - 1];
    const y_top_visible_distance = Math.floor(Environment.CAMERA_HEIGHT / 2) + 2;
    const y_bottom_visible_distance = Math.floor(Environment.CAMERA_HEIGHT / 2) - 2;
    const grid_top_y = agent_y - y_top_visible_distance;
    const grid_bottomY = grid_top_y + Environment.CAMERA_HEIGHT - 1;
    const x_visible_distance = Math.floor(Environment.CAMERA_WIDTH / 2);
    const grid_x_left_end = agent_x - x_visible_distance; // NOTE: gamescreen_width_fixed === false 
    const grid_x_right_end = grid_x_left_end + Environment.CAMERA_WIDTH - 1;

    const visible_top_y_end = grid_top_y - 0.5;
    const visible_bottomY_end = visible_top_y_end + Environment.CAMERA_HEIGHT;
    const visible_x_left_end = grid_x_left_end - 0.5;
    const visible_x_right_end = visible_x_left_end + Environment.CAMERA_WIDTH;
    const game_screen_rect: [number, number, number, number] = [
      visible_top_y_end,
      visible_bottomY_end,
      visible_x_left_end,
      visible_x_right_end,
    ];
    { // Meta info [0 ~ 4]
      let time_left = 0;
      if (!this.episodeOver) {
        time_left = Math.max(0, (this.timeLeftMs - 1000) / (EPISODE_DURATION_MS - 1000));
      }
      let top_end_closeness = 0;
      if (grid_top_y < agent_y_range[0]) {
        top_end_closeness = (y_top_visible_distance - (agent_y - agent_y_range[0])) / y_top_visible_distance;
      }
      let bottom_end_closeness = 0;
      if (grid_bottomY > agent_y_range[1]) {
        bottom_end_closeness = (y_bottom_visible_distance - (agent_y_range[1] - agent_y)) / y_bottom_visible_distance;
      }
      let left_end_closeness = 0;
      if (grid_x_left_end < this.agentRangeX[0]) {
        left_end_closeness = (x_visible_distance - (agent_x - this.agentRangeX[0])) / x_visible_distance;
      }
      let right_end_closeness = 0;
      if (this.agentRangeX[1] < grid_x_right_end) {
        right_end_closeness = (x_visible_distance - (this.agentRangeX[1] - agent_x)) / x_visible_distance;
      }
      obs.push(
        time_left,
        top_end_closeness,
        bottom_end_closeness,
        left_end_closeness,
        right_end_closeness
      );
      this.assertListLength(obs, 5);
    }
    { // Tile types near the agent [5 ~ 12]
      const is_dangerous: number[] = [];
      const is_crosswalk: number[] = [];
      for (const action of [Action.NOTHING, Action.UP, Action.DOWN, Action.RIGHT, Action.LEFT]) {
        const [dx, dy] = ACTION_TO_DELTA[action];
        const grid_x = agent_x + dx;
        const grid_y = agent_y + dy;

        const out_of_move_range =
          grid_y < agent_y_range[0] ||
          grid_y > agent_y_range[1] ||
          grid_x < this.agentRangeX[0] ||
          grid_x > this.agentRangeX[1];

        // Python: if action != RIGHT and action != LEFT:
        if (action !== Action.RIGHT && action !== Action.LEFT) {
          if (out_of_move_range) is_dangerous.push(0);
          else is_dangerous.push(this.world!!.danger_row[grid_y] ? 1 : 0);
        }

        if (out_of_move_range) {
          is_crosswalk.push(0);
        } else {
          is_crosswalk.push(this.world!!.crosswalk_map[grid_y][grid_x] ? 1 : 0);
        }
      }

      obs.push(...is_dangerous);
      obs.push(...is_crosswalk);
      this.assertListLength(obs, 13);
    }
    { // Target road info [13 ~ 23]
      this.prev_road = null;
      this.target_road = null;
      this.target_road_crosswalk_visible = false;
      const roads = this.world!!.roads.elements;
      for (let i = roads.length; i > 0; i--) {
        const road = roads[i-1];
        if (road.topY > agent_y) {
          this.prev_road = road;
          continue;
        }
        this.target_road = road;
        break;
      }

      let penalty = 0.0;
      let dist_end_of_target_road = 1.0;
      let dist_start_of_target_road = 0.0;
      let visible_car_count = 0;
      let dangerous_car_counts = [0, 0, 0, 0, 0, 0];
      if (this.target_road != null) {
        const road = this.target_road;
        if (road.crosswalk != null) {
          if (isOverlapping(road.crosswalk.leftEnd, road.crosswalk.rightEnd, grid_x_left_end, grid_x_right_end)) {
            this.target_road_crosswalk_visible = true;
          }
        }
        penalty = road.riskDetail.penalty / this.maxCarPenalty;

        const is_crossing = road.bottomY >= agent_y && agent_y >= road.topY;
        if (is_crossing) {
          dist_end_of_target_road = (agent_y - road.topY) / 4;
          dist_start_of_target_road = (road.bottomY - agent_y + 1) / 4;
        }

        const cars = this.world!!.cars.roadUidToCarsDict[road.uid] || [];
        for (const car of cars) {
          const car_rect = car.getHitbox();
          if (!isOverlappingRectangles(car_rect, game_screen_rect)) continue;

          visible_car_count += 1;

          const car_left_x = car_rect[2];
          const car_right_x = car_rect[3];
          const is_left = car_left_x <= agent_x;
          const is_right = agent_x <= car_right_x;

          const going_right = car.carDetails.goRight;

          // Python: if (is_left and not going_right) or (is_right and going_right): continue
          if ((is_left && !going_right) || (is_right && going_right)) continue;

          const car_top_row = Math.min(...car.rows);
          const car_bottom_row = Math.max(...car.rows);

          const car_in_front = car_top_row < agent_y;
          const car_same_row = car_top_row === agent_y || agent_y === car_bottom_row;
          const car_in_back = agent_y < car_bottom_row;

          if (car_in_front && is_left) dangerous_car_counts[0] += 1; // NW
          if (car_in_front && is_right) dangerous_car_counts[1] += 1; // NE
          if (car_in_back && is_left) dangerous_car_counts[2] += 1; // SE
          if (car_in_back && is_right) dangerous_car_counts[3] += 1; // SW
          if (car_same_row && is_left) dangerous_car_counts[4] += 1; // left
          if (car_same_row && is_right) dangerous_car_counts[5] += 1; // right
        }

        visible_car_count /= 6;
        dangerous_car_counts = dangerous_car_counts.map((cnt) => cnt / 6);
      }

      const crosswalk_visible = this.target_road_crosswalk_visible ? 1.0 : 0.0;

      obs.push(
        crosswalk_visible,
        penalty,
        dist_end_of_target_road,
        dist_start_of_target_road,
        visible_car_count
      );
      obs.push(...dangerous_car_counts);
      this.assertListLength(obs, 24);
    }
    { // Distance from crosswalks [24 ~ 32]
      let crosswalk_closeness_list = [];

      for (let i = this.world!!.roads.elements.length - 1; i >= 0; i--) {
        const road = this.world!!.roads.elements[i];
        if (road.topY > agent_y) continue;         // already crossed
        if (road.bottomY < grid_top_y) break;      // out of sight
        if (road.crosswalk == null) continue;

        const cw = road.crosswalk;
        const crosswalk_closeness = [0, 0, 0]; // up, right, left

        if (cw.topRow <= agent_y && agent_y <= cw.endRow) {
          crosswalk_closeness[0] = 1;
        } else if (agent_y >= cw.endRow) {
          if (cw.endRow >= grid_top_y) {
            crosswalk_closeness[0] =
              (y_top_visible_distance - (agent_y - cw.endRow)) / y_top_visible_distance;
          }
        }

        if (cw.leftEnd <= agent_x && agent_x <= cw.rightEnd) {
          crosswalk_closeness[1] = 1;
          crosswalk_closeness[2] = 1;
        } else if (agent_x < cw.leftEnd) {
          if (cw.leftEnd <= grid_x_right_end) {
            crosswalk_closeness[1] =
              (x_visible_distance + 1 - (cw.leftEnd - agent_x)) / (x_visible_distance + 1);
          }
        } else if (cw.rightEnd < agent_x) {
          if (grid_x_left_end <= cw.rightEnd) {
            crosswalk_closeness[2] =
              (x_visible_distance + 1 - (agent_x - cw.rightEnd)) / (x_visible_distance + 1);
          }
        }

        crosswalk_closeness_list.push(...crosswalk_closeness);
        if (crosswalk_closeness_list.length === 9) break; // 3*3
      }

      while (crosswalk_closeness_list.length < 9) {
        crosswalk_closeness_list.push(0.0, 0.0, 0.0);
      }

      obs.push(...crosswalk_closeness_list);
      this.assertListLength(obs, 33);
    }
    { // Cars [33 ~ 112]
      // (1) Adjacent tile cars (8)
      const car_in_adjecent_tiles = [];
      // NW, N, NE, E, SE, S, SW, W
      const dx8 = [-1, 0, 1, 1, 1, 0, -1, -1];
      const dy8 = [-1, -1, -1, 0, 1, 1, 1, 0];

      for (let i = 0; i < 8; i++) {
        const grid_x = agent_x + dx8[i];
        const grid_y = agent_y + dy8[i];
        const tile_rect: [number, number, number, number] = [grid_y - 0.5, grid_y + 0.5, grid_x - 0.5, grid_x + 0.5];

        let car_in_tile = false;
        if (this.world!!.row_to_cars_dict[grid_y]) {
          for (const car of this.world!!.row_to_cars_dict[grid_y]) {
            if (isOverlappingRectangles(tile_rect, car.getHitbox())) {
              car_in_tile = true;
              break;
            }
          }
        }
        car_in_adjecent_tiles.push(car_in_tile ? 1.0 : 0.0);
      }
      obs.push(...car_in_adjecent_tiles);

      // (2) dangerous_car_info_list
      const dangerous_car_info_list = [];
      const visible_left_width = agent_left_x - visible_x_left_end;
      const visible_right_width = visible_x_right_end - agent_right_x;
      for (let gy = agent_y - 4; gy <= grid_bottomY; gy++) {
        let left_cars = [];
        let right_cars = [];

        const is_prev_road =
          this.prev_road != null && this.prev_road.topY <= gy && gy <= this.prev_road.bottomY;
        const is_target_road =
          this.target_road != null && this.target_road.topY <= gy && gy <= this.target_road.bottomY;

        if (is_prev_road || is_target_road) {
          const rowCars = this.world!!.row_to_cars_dict[gy] || [];
          for (const car of rowCars) {
            let [car_left_x, car_right_x] = car.getCurXPos();

            if (car_right_x < visible_x_left_end) continue;
            if (visible_x_right_end < car_left_x) continue;

            car_left_x = Math.max(car_left_x, visible_x_left_end);
            car_right_x = Math.min(car_right_x, visible_x_right_end);

            const car_speed = car.isMoving ? (Math.abs(car.defaultSpeed) / this.maxCarSpeed) : 0;

            // cars on the left side and coming toward the agent
            if (car_left_x <= agent_right_x && car.carDetails.goRight) {
              let car_head_closeness, car_tail_distance;
              if (car_right_x < agent_left_x) {
                // [car] < [agent]
                car_head_closeness =
                  (visible_left_width - (agent_left_x - car_right_x)) / visible_left_width;
                car_tail_distance = 0.0;
              } else {
                // car overlapping with the agent
                car_head_closeness = 1.0;
                car_tail_distance = (agent_right_x - car_left_x) / (this.maxCarWidth + agent_width);
              }

              let car_tail_closeness;
              if (car_left_x < agent_left_x) {
                // [car]=>
                //    [agent]                
                car_tail_closeness = (visible_left_width - (agent_left_x - car_left_x)) / visible_left_width;
              } else {
                //   =>[car]
                // [agent]
                car_tail_closeness = 1.0;
              }

              left_cars.push([car_head_closeness, car_tail_closeness, car_tail_distance, car_speed]);
            }

            // cars on the right side and coming toward the agent
            if (agent_left_x <= car_right_x && !car.carDetails.goRight) {
              let car_head_closeness, car_tail_distance;
              if (agent_right_x < car_left_x) {
                // [agent] < [car]
                car_head_closeness =
                  (visible_right_width - (car_left_x - agent_right_x)) / visible_right_width;
                car_tail_distance = 0.0;
              } else {
                // car overlapping with the agent
                car_head_closeness = 1.0;
                car_tail_distance = (car_right_x - agent_left_x) / (this.maxCarWidth + agent_width);
              }
              let car_tail_closeness;
              if (agent_right_x < car_right_x) {
                //   <=[car]
                // [agent]
                car_tail_closeness = (visible_right_width - (car_right_x - agent_right_x)) / visible_right_width;
              } else {
                // [car]<=
                //   [agent]
                car_tail_closeness = 1.0;
              }
              right_cars.push([car_head_closeness, car_tail_closeness, car_tail_distance, car_speed]);
            }
          }
        }

        left_cars.sort((a, b) => b[0] - a[0]);
        right_cars.sort((a, b) => b[0] - a[0]);
        while (left_cars.length < 2) {
          left_cars.push([0.0, 0.0, 0.0, 0.0]);
        }
        while (right_cars.length < 2) {
          right_cars.push([0.0, 0.0, 0.0, 0.0]);
        }

        // consider the position and speed of 2 cars on each side
        dangerous_car_info_list.push(...left_cars[0]);  // [head closeness, tail closeness, tail distance, speed]
        dangerous_car_info_list.push(...right_cars[0]); // [head closeness, tail closeness, tail distance, speed]
        dangerous_car_info_list.push(left_cars[1][0], left_cars[1][1]);   // [head closeness, tail closeness]
        dangerous_car_info_list.push(right_cars[1][0], right_cars[1][1]); // [head closeness, tail closeness]
      }

      obs.push(...dangerous_car_info_list);
      this.assertListLength(obs, 113);
    }
    
    if (this.debug) {
      let mn = Infinity, mx = -Infinity;
      for (const v of obs) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
      if (mx > 1.0 + 1e-9 || mn < 0.0 - 1e-9) {
        throw new Error(`Obs out of [0,1] range: min=${mn}, max=${mx}`);
      }
    }
    this.state.obs = obs;
  }

  private assertListLength(arr: { length: number }, expected: number): asserts arr is { length: number } {
    if (!this.debug) return;
    if (arr.length !== expected) throw new Error(`len=${arr.length}, expected=${expected}`);
  }

  private resetEpisodeMetadata() {
    const agent = this.world!!.agent;
    const visible_distances = this.game_screen_relative_positions()[0];
    const agent_y_range = [Agent.TARGET_LANE, Environment.MAP_GRID_HEIGHT - 1];
    const [grid_y_top_visible_distance, grid_y_bottom_visible_distance, grid_x_visible_distance] = visible_distances;

    const agent_metadata = {
      initial_pos: agent.initPos,
      x_range: this.agentRangeX,
      y_range: agent_y_range,
      speed: agent.defaultSpeed,
      grid_y_top_visible_distance,
      grid_y_bottom_visible_distance,
      grid_x_visible_distance,
    };

    const roads_metadata: { is_dangerous_row: boolean[], roads: object[] } = {
      is_dangerous_row: this.world!!.danger_row,
      roads: [],
    };

    for (let i = this.world!!.roads.elements.length - 1; i >= 0; i -= 1) {
      const road = this.world!!.roads.elements[i];
      roads_metadata.roads.push({
        uid: road.uid,
        top_y: road.topY,
        bottomY: road.bottomY,
        directions: road.directions,
        car_color_type: road.carColorType, // 0=GREEN, 1=YELLOW, 2=RED
        penalty: road.riskDetail.penalty, // 100=GREEN, 500=YELLOW, 1000=RED
        crosswalk: road.crosswalk == null ? null : { uid: road.crosswalk.uid, col: road.crosswalk.col },
      });
    }

    const cars_metadata = [];
    for (const car of this.world!!.cars.elements) {
      cars_metadata.push({
        uid: car.uid,
        road_uid: car.road.uid,
        rows: car.rows,
        car_type: car.carDetails.carType,
        penalty: car.carDetails.penalty,
        go_right: car.carDetails.goRight,
        car_grid_height: car.carDetails.gridHeight,
        car_grid_width: car.carDetails.gridWidth,
      });
    }

    this.state.episodeMetadata = {
      env_configuration: {
        map_grid_width: Environment.MAP_GRID_WIDTH,
        map_grid_height: Environment.MAP_GRID_HEIGHT,
        camera_width: Environment.CAMERA_WIDTH,
        camera_height: Environment.CAMERA_HEIGHT,
        min_gameover_screen_time: GAME_OVER_SCREEN_MS,
        initial_pix_square_size: this.pixSquareSize,
        debug: this.debug,
      },
      episode_configuration: {
        seed: this.episodeSeed,
        agent: agent_metadata,
        roads: roads_metadata,
        cars: cars_metadata,
      },
    };
  }

  private updateInfo() {
    const agent = this.world!!.agent;
    // eslint-disable-next-line 
    const [agent_top_y, agent_bottom_y, agent_left_x, agent_right_x] = agent.getHitbox();
    // eslint-disable-next-line 
    const [__, game_screen_grid_rect, game_screen_rect] = this.game_screen_relative_positions()

    const [agent_grid_x, agent_grid_y] = agent.getCurLocationGrid();
    const [grid_top_y, grid_bottom_y, grid_x_left_end, grid_x_right_end] = game_screen_grid_rect;
    const [visible_top_y_end, visible_bottom_y_end, visible_x_left_end, visible_x_right_end] = game_screen_rect;

    let target_road_info = {};
    if (this.target_road !== null) {
      target_road_info = {
        target_road_uid: this.target_road.uid,
        road_size: this.target_road.bottomY - this.target_road.topY + 1, 
        penalty: this.target_road.riskDetail.penalty,
        has_crosswalk: this.target_road.crosswalk !== null,
      }
    }

    const visible_cars_per_lane: Record<number, object> = {};
    // only consider until 4 rows ahead of agent since maximum road size is 4
    for (let grid_y = agent_grid_y - 4; grid_y <= grid_bottom_y; grid_y += 1) {
      // only consider the roads near the agent
      const is_prev_road =
        this.prev_road != null &&
        this.prev_road.topY <= grid_y &&
        grid_y <= this.prev_road.bottomY;

      const is_target_road =
        this.target_road != null &&
        this.target_road.topY <= grid_y &&
        grid_y <= this.target_road.bottomY;

      if (!is_prev_road && !is_target_road) continue;

      const cars = [];
      const rowCars = this.world!!.row_to_cars_dict[grid_y] || [];

      for (const car of rowCars) {
        let [
          car_top_y,
          car_bottom_y,
          car_left_x,
          car_right_x,
        ] = car.getHitbox();

        // filter out of sight
        if (car_right_x < visible_x_left_end) continue;
        if (visible_x_right_end < car_left_x) continue;

        car_left_x = Math.max(car_left_x, visible_x_left_end);
        car_right_x = Math.min(car_right_x, visible_x_right_end);

        const car_speed = car.isMoving ? Math.abs(car.defaultSpeed) / this.maxCarSpeed : 0;
        const car_going_right = car.carDetails.goRight;

        cars.push({
          top_y: car_top_y,
          bottom_y: car_bottom_y,
          left_x: car_left_x,
          right_x: car_right_x,
          speed: car_speed,
          going_right: car_going_right,
        });
      }

      visible_cars_per_lane[grid_y] = cars;
    }

    this.state.playInfo = {
      game_info: {
        time_left: this.timeLeftMs,
        game_end_extra_score: this.world!!.getEpisodeResultExtraScore(),
        cur_episode_score: this.cur_episode_rewards,
      },
      map: {
        // game screen grid rectangle
        grid_top_y,
        grid_bottom_y,
        grid_x_left_end,
        grid_x_right_end,

        // game screen rectangle
        visible_top_y_end,
        visible_bottom_y_end,
        visible_x_left_end,
        visible_x_right_end,

        target_road_uid: this.target_road ? this.target_road.uid : null,
        target_road_crosswalk_visible: this.target_road_crosswalk_visible,
        activated_crosswalk_uid: this.world!!.roads.activatedCrosswalkUid,
      },
      agent: {
        grid_x: agent_grid_x,
        grid_y: agent_grid_y,
        cur_location: agent.curLocation,
        target_location: agent.targetLocation,
        facing_direction: agent.lastDirection,
        // NOTE: hitbox = [top_y, bottom_y, left_x, right_x]
        top_y: agent_top_y,
        bottom_y: agent_bottom_y,
        // NOTE: agent_width = agent_right_x - agent_left_x
        left_x: agent_left_x,
        right_x: agent_right_x,
        dead: agent.isDead,
      },
      target_road_info: target_road_info,
      visible_cars: visible_cars_per_lane,
    };
  }

  private game_screen_relative_positions() {
    const [agent_grid_x, agent_grid_y] = this.world!!.agent.getCurLocationGrid();
    const grid_y_top_visible_distance = Math.floor(Environment.CAMERA_HEIGHT / 2) + 2;
    const grid_y_bottom_visible_distance = Math.floor(Environment.CAMERA_HEIGHT / 2) - 2;
    const grid_x_visible_distance = Math.floor(Environment.CAMERA_WIDTH / 2);
    const visible_distances = [
      grid_y_top_visible_distance,
      grid_y_bottom_visible_distance,
      grid_x_visible_distance,
    ];

    // game screen grid rectangle
    const grid_top_y = agent_grid_y - grid_y_top_visible_distance;
    const grid_bottom_y = grid_top_y + Environment.CAMERA_HEIGHT - 1;
    const grid_x_left_end = agent_grid_x - grid_x_visible_distance; // NOTE: this.gamescreen_width_fixed is always false
    const grid_x_right_end = grid_x_left_end + Environment.CAMERA_WIDTH - 1;
    const game_screen_grid_rect = [
      grid_top_y,
      grid_bottom_y,
      grid_x_left_end,
      grid_x_right_end,
    ];

    // game screen rectangle (continuous coords)
    const visible_top_y_end = grid_top_y - 0.5;
    const visible_bottom_y_end = visible_top_y_end + Environment.CAMERA_HEIGHT;
    const visible_x_left_end = grid_x_left_end - 0.5;
    const visible_x_right_end = visible_x_left_end + Environment.CAMERA_WIDTH;

    const game_screen_rect = [
      visible_top_y_end,
      visible_bottom_y_end,
      visible_x_left_end,
      visible_x_right_end,
    ];
    return [visible_distances, game_screen_grid_rect, game_screen_rect];
  }
}
