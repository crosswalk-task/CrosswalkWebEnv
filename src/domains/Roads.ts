import { CarColorType, RiskDetail, RiskDetails, CarHeightType, CarDirection } from "./gameobjects/CarDetails";
import { Agent } from "./gameobjects/Agent";
import { Box, Random } from "./utils";

enum RowType {
  SAFE = 0,
  CAR_GOING_RIGHT = 1,
  CAR_GOING_LEFT = 2,
}

export class Roads {
  static MINROAD_SIZE: number = 2;
  static MAXROAD_SIZE: number = 4;
  static ROAD_GRAY_COLOR: string = "#595959"; // R:89, G:89, B:89
  static ROAD_WHITE_COLOR: string = "#FAFAFA"; // R:250, G:250, B:250
  static SAFE_WHITE_COLOR: string = "#D9D9D9"; // R:217, B:217, B:217

  public readonly elements: Road[];
  private mapGridBox: Box;
  private agent: Agent;
  public safeRowIdxList: number[] = [];
  private laneBoundaryIdxList: number[] = [];
  private otherDirectionBoundaryIdxList: number[] = [];
  public activatedCrosswalkUid = 0; // NOTE: maximum of only 1 crosswalk can be activated

  constructor(
    agent: Agent,
    cameraWidth: number,
    mapGridBox: Box,
    initialHeightPadding: number,
    random: Random,
  ) {
    this.mapGridBox = mapGridBox;
    const safeEndLaneCount = 1;
    const safeStartLaneCount = 1 + initialHeightPadding; // save safe zones near start lane
    const maxCarGridHeight = CarHeightType.LARGE;
    if (maxCarGridHeight > Roads.MINROAD_SIZE) {
      throw new Error(`maximum car height can not be bigger than minimum road size ${maxCarGridHeight} > ${Roads.MINROAD_SIZE}`);
    }

    const rowTypes: RowType[] = new Array(mapGridBox.height).fill(RowType.SAFE);
    let consecutiveDangerLanes = 0;
    let consecutiveSafeLanes = 1;
    let curRowIdx = safeEndLaneCount;
    while (curRowIdx < mapGridBox.height) {
       // go back to add roads when there are too many consecutive safe zones
      if (consecutiveSafeLanes >= Roads.MINROAD_SIZE + 1) {
        const goBack = Roads.MINROAD_SIZE;
        curRowIdx -= goBack;
        consecutiveSafeLanes -= goBack;
      }

      const availableRows = mapGridBox.height - safeStartLaneCount - curRowIdx;
      if (availableRows <= 0) break;
      if (availableRows >= Roads.MINROAD_SIZE && consecutiveDangerLanes < Roads.MAXROAD_SIZE) {
        let rowType: RowType;
        if (curRowIdx === 1 || availableRows === Roads.MINROAD_SIZE) {
          // reduce consecutive safe zones near the start and end
          rowType = random.choice([RowType.CAR_GOING_RIGHT, RowType.CAR_GOING_LEFT]);
        } else {
          rowType = random.choice([RowType.SAFE, RowType.CAR_GOING_RIGHT, RowType.CAR_GOING_LEFT]);
        }
        if (rowType !== RowType.SAFE) {
          for (let i = 0; i < Roads.MINROAD_SIZE; i++) {
            rowTypes[curRowIdx] = rowType;
            consecutiveDangerLanes += 1;
            consecutiveSafeLanes = 0;
            curRowIdx += 1;
          }
          continue;
        }
      }
      consecutiveDangerLanes = 0;
      consecutiveSafeLanes += 1;
      curRowIdx += 1;
    }

    this.safeRowIdxList = [];
    for (let idx = 0; idx < rowTypes.length; idx++) {
      if (rowTypes[idx] === RowType.SAFE) {
        this.safeRowIdxList.push(idx);
      }
    }

    this.laneBoundaryIdxList = [];
    for (let idx = 0; idx < rowTypes.length - 1; idx++) {
      if (rowTypes[idx] !== RowType.SAFE && rowTypes[idx + 1] !== RowType.SAFE) {
        this.laneBoundaryIdxList.push(idx);
      }
    }

    this.otherDirectionBoundaryIdxList = [];
    for (let idx = 0; idx < rowTypes.length - 1; idx++) {
      if (rowTypes[idx] === RowType.CAR_GOING_RIGHT && rowTypes[idx + 1] === RowType.CAR_GOING_LEFT) {
        this.otherDirectionBoundaryIdxList.push(idx);
        this.laneBoundaryIdxList = this.laneBoundaryIdxList.filter((x) => x !== idx);
      }
      if (rowTypes[idx] === RowType.CAR_GOING_LEFT && rowTypes[idx + 1] === RowType.CAR_GOING_RIGHT) {
        this.otherDirectionBoundaryIdxList.push(idx);
        this.laneBoundaryIdxList = this.laneBoundaryIdxList.filter((x) => x !== idx);
      }
    }

    let uid = 0;
    const roads: Road[] = [];
    let danger_startIdx: number | null = null;
    for (let rowIdx = 0; rowIdx < rowTypes.length; rowIdx++) {
      const rowType = rowTypes[rowIdx];
      if (danger_startIdx === null) {
        if (rowType !== RowType.SAFE) {
          danger_startIdx = rowIdx;
        }
        continue;
      }
      if (rowType === RowType.SAFE) {
        uid += 1;
        const topY = danger_startIdx;
        const bottomY = rowIdx - 1;
        roads.push(new Road(uid, topY, bottomY, rowTypes.slice(topY, bottomY + 1), random));
        danger_startIdx = null;
      }
    }

    // add crosswalks on road
    let crosswalkUid = 0;
    const [agent_initial_col] = agent.curLocation;
    const buffer = Math.trunc(cameraWidth * 0.3);
    let left = random.random() >= 0.5;
    for (const road of roads) {
      if (random.random() >= CrossWalk.RATIO) continue;
      crosswalkUid += 1;
      const crosswalkRange: [number, number] = left
        ? [agent.MIN_X, Math.max(agent.MIN_X + 1, Math.trunc(agent_initial_col - buffer))]
        : [Math.min(agent.MAX_X - 1, Math.trunc(agent_initial_col + buffer)), agent.MAX_X];
      left = !left;
      const col = random.integers(crosswalkRange[0], crosswalkRange[1]);
      road.crosswalk = new CrossWalk(crosswalkUid, col, road.topY, road.bottomY);
    }

    this.agent = agent;
    this.elements = roads;
  }

  public activateCrosswalks() {
    this.activatedCrosswalkUid = 0;
    const [agent_x, agent_y] = this.agent.getCurLocationRounded();
    for (const road of this.elements) {
      const crosswalk = road.crosswalk;
      if (!crosswalk) continue;
      const topY = crosswalk.topRow - 1; // deactivate right after completely crossing the road
      const bottomY = crosswalk.endRow + 1; // activate before crossing the road
      const left_x = crosswalk.leftEnd;
      const right_x = crosswalk.rightEnd;
      const isActive = topY < agent_y && agent_y <= bottomY && left_x <= agent_x && agent_x <= right_x;
      crosswalk.isActive = isActive;
      if (isActive) {
        this.activatedCrosswalkUid = crosswalk.uid;
        break;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, pixSquareSize: number, cameraGridBox: Box) {
    const adjustment = 0.5;
    const renderGridTop = Math.max(0, this.mapGridBox.top - cameraGridBox.top) - adjustment;
    const renderGridBottom = (cameraGridBox.height) + Math.min(1, this.mapGridBox.bottom - cameraGridBox.bottom - adjustment);
    const renderGridLeft = Math.max(0, this.mapGridBox.left - cameraGridBox.left) - adjustment;
    const renderGridRight = (cameraGridBox.width) + Math.min(2, this.mapGridBox.right - cameraGridBox.right + adjustment);

    const renderLeftPx = (renderGridLeft) * pixSquareSize;
    const renderWidthPx = (renderGridRight - renderGridLeft) * pixSquareSize;
    const renderHeightPx = (renderGridBottom - renderGridTop) * pixSquareSize;

    // road background
    ctx.fillStyle = Roads.ROAD_GRAY_COLOR;
    ctx.fillRect(
      (renderGridLeft) * pixSquareSize,
      (renderGridTop) * pixSquareSize,
      renderWidthPx,
      renderHeightPx,
    );
  
    // safe zone
    ctx.fillStyle = Roads.SAFE_WHITE_COLOR;
    for (const safeRowIdx of this.safeRowIdxList) {
      if (cameraGridBox.top - adjustment <= safeRowIdx && safeRowIdx <= cameraGridBox.bottom + adjustment + 1) {
        const renderGridTopSafeRowPx = (safeRowIdx - cameraGridBox.top - adjustment) * pixSquareSize;
        ctx.fillRect(renderLeftPx, renderGridTopSafeRowPx, renderWidthPx, pixSquareSize);
      }
    }
    // other direction solid boundary
    ctx.strokeStyle = Roads.ROAD_WHITE_COLOR;
    ctx.lineWidth = 0.05 * pixSquareSize;
    for (const boundary of this.otherDirectionBoundaryIdxList) {
      if (cameraGridBox.top - adjustment <= boundary && boundary <= cameraGridBox.bottom + adjustment + 1) {
        const y = (boundary - cameraGridBox.top + adjustment) * pixSquareSize;
        ctx.beginPath();
        ctx.moveTo(renderGridLeft * pixSquareSize, y);
        ctx.lineTo(renderGridRight * pixSquareSize, y);
        ctx.stroke();
      }
    }

    // lane boundaries as dashes
    ctx.strokeStyle = Roads.ROAD_WHITE_COLOR;
    ctx.lineWidth = 6;
    for (const boundaryIdx of this.laneBoundaryIdxList) {
      if (cameraGridBox.top - adjustment <= boundaryIdx && boundaryIdx <= cameraGridBox.bottom + adjustment + 1) {
        for (let x = 0; x < this.mapGridBox.width; x += 5) {
          const leftGridEnd = (x - cameraGridBox.left + adjustment);
          const rightGridEnd = leftGridEnd + 2;
          if (rightGridEnd <= renderGridLeft) continue;
          if (renderGridRight <= leftGridEnd) continue;
          const y = (boundaryIdx - cameraGridBox.top + adjustment) * pixSquareSize;
          ctx.beginPath();
          ctx.moveTo(leftGridEnd * pixSquareSize, y);
          ctx.lineTo(rightGridEnd * pixSquareSize, y);
          ctx.stroke();
        }
      }
    }

    // crosswalks
    for (const road of this.elements) {
      const crosswalk = road.crosswalk;
      if (!crosswalk) continue;
      if (cameraGridBox.top - adjustment <= road.bottomY && road.topY <= cameraGridBox.bottom + adjustment + 1) {
        const [cwGridLeft, cwGridRight] = crosswalk.getActivationRangeX();
        if (cwGridRight + 2 <= cameraGridBox.left) continue;
        if (cameraGridBox.right <= cwGridLeft - 2) continue;

        let start_x = (cwGridLeft - cameraGridBox.left) * pixSquareSize;
        const topY = (road.topY - cameraGridBox.top - adjustment) * pixSquareSize;
        const cw_width = (cwGridRight - cwGridLeft) * pixSquareSize;
        { // cover up background (-1 pixel at top and bottom, +pixSquareSize at left and right)
          const bottomY = (road.bottomY - cameraGridBox.top + adjustment) * pixSquareSize;
          const cw_height = bottomY - topY;
          ctx.fillStyle = Roads.ROAD_GRAY_COLOR;
          ctx.fillRect(start_x - pixSquareSize, topY + 1, cw_width + pixSquareSize * 2, cw_height - 1);
        }
        { // stripes
          const stripe_count = 3 * (road.bottomY - road.topY + 1);
          const stripe_thickness = pixSquareSize / 3;
          ctx.fillStyle = Roads.ROAD_WHITE_COLOR;
          for (let i = 0; i < stripe_count; i++) {
            for (let j = 0; j < 2; j++) {
              if (i % 2 === j) continue;
              const stripeX = start_x + (cw_width / 2) * j;
              const stripeY = topY + i * stripe_thickness;
              ctx.fillRect(stripeX, stripeY, cw_width / 2, stripe_thickness);
            }
          }
        }
      }
    }
  }
}

export class Road {
  public static COMPOSITION_SIZE = 2;

  public readonly uid: number;
  public readonly topY: number;
  public readonly bottomY: number;
  public readonly directions: CarDirection[];
  public readonly carColorType: CarColorType;
  public readonly riskDetail: RiskDetail;
  public crosswalk: CrossWalk | null = null;

  constructor(uid: number, topY: number, bottomY: number, rowTypes: RowType[], random: Random) {
    this.uid = uid;
    this.topY = topY;
    this.bottomY = bottomY;
    this.directions = rowTypes.map((rowType) => rowType === RowType.CAR_GOING_RIGHT ? CarDirection.GO_RIGHT : CarDirection.GO_LEFT);
    this.carColorType = random.choice([CarColorType.RED, CarColorType.YELLOW, CarColorType.GREEN]);
    this.riskDetail = RiskDetails[this.carColorType];
  }
}

export class CrossWalk {
  static RATIO = 0.6;
  static THRESHOLD_DISTANCE = 0.3;

  uid: number;
  col: number;
  leftEnd: number;
  rightEnd: number;
  topRow: number;
  endRow: number;
  isActive: boolean;

  constructor(uid: number, col: number, topRow: number, endRow: number) {
    this.uid = uid;
    this.col = col;
    this.leftEnd = col - 1;
    this.rightEnd = col + 1;
    this.topRow = topRow;
    this.endRow = endRow;
    this.isActive = false;
  }

  public getActivationRangeX(): [number, number] {
    const left = this.leftEnd - CrossWalk.THRESHOLD_DISTANCE;
    const right = this.rightEnd + CrossWalk.THRESHOLD_DISTANCE;
    return [left, right];
  }

  public toString() {
    return `CrossWalk(active=${this.isActive}, x=(${this.leftEnd}, ${this.rightEnd}), y=(${this.topRow}, ${this.endRow}))`;
  }
}
