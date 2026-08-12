export class Box {
    public readonly top: number
    public readonly bottom: number
    public readonly left: number
    public readonly right: number
    public readonly width: number
    public readonly height: number

    public constructor(top: number, left: number, width: number, height: number) {
        this.top = top;
        this.bottom = top + height;
        this.left = left;
        this.right = left + width;
        this.width = width;
        this.height = height;
    }
}

// corresponds to python `random`
export class Random {
  private seed: number;
  constructor(seed: number = Math.floor(Math.random() * 1e9)) {
    this.seed = seed >>> 0;
  }
  private next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  random(): number {
    return this.next();
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  // corresponds to python `numpy.random.integers`
  integers(low: number, high: number): number {
    // inclusive low, inclusive high (to match numpy.random.integers behavior used in code)
    const lo = Math.min(low, high);
    const hi = Math.max(low, high);
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
}

export function isOverlapping(
  left1: number,
  right1: number,
  left2: number,
  right2: number
): boolean {
  return !(right1 < left2 || right2 < left1);
}

// rect = [top, bottom, left, right]
export function isOverlappingRectangles(
  rect1: [number, number, number, number],
  rect2: [number, number, number, number]
): boolean {
  const [t1, b1, l1, r1] = rect1;
  const [t2, b2, l2, r2] = rect2;

  if (r1 < l2 || r2 < l1) return false;
  if (b1 < t2 || b2 < t1) return false;
  return true;
}
