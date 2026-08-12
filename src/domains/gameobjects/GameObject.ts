export abstract class GameObject {
  defaultSpeed: number;
  curLocation: [number, number];
  targetLocation: [number, number];
  stepsPerSecond: number;
  isMoving: boolean;

  constructor(
    defaultSpeed: number,
    curLocation: [number, number],
    stepsPerSecond: number
  ) {
    this.defaultSpeed = defaultSpeed;
    this.curLocation = [...curLocation];
    this.targetLocation = [...curLocation];
    this.stepsPerSecond = stepsPerSecond;
    this.isMoving = true;
  }

  public updatePosition(dt: number) {
    const [tx, ty] = this.targetLocation;
    const [cx, cy] = this.curLocation;

    let dx = tx - cx;
    let dy = ty - cy;

    if (Math.abs(dx) < 0.1) {
      this.curLocation[0] = tx;
      dx = 0;
    }
    if (Math.abs(dy) < 0.1) {
      this.curLocation[1] = ty;
      dy = 0;
    }
    if (dx === 0 && dy === 0) return;

    const dist = (dx !== 0 && dy !== 0) ? Math.hypot(dx, dy) : Math.max(Math.abs(dx), Math.abs(dy));
    const step = Math.abs(this.defaultSpeed) * (dt / 1000.0);
    const move = Math.min(step, dist);
    const ux = dx / dist;
    const uy = dy / dist;

    this.curLocation[0] += ux * move;
    this.curLocation[1] += uy * move;
    this.isMoving = true;
  }

  public stop() {
    this.targetLocation = [...this.curLocation];
    this.isMoving = false;
  }

  public abstract getHitbox(): [number, number, number, number]
}
