import { AgentStatus } from "./Agent"
import { Action, DirectionAction, actionToString } from "../Action"
import { CAR_CANDIDATES, CarColorType, CarDirection, CarDetails, CarHeightType, RiskDetails } from "./CarDetails"
import { CarAssets, PlayerAssets } from "./types";

const playerSpriteUrls = import.meta.glob(
  "../../assets/sprites/player/*.png",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

const carSpriteUrls = import.meta.glob(
  "../../assets/sprites/cars/*.png",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

function createFileNameUrlMap(modules: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, url]) => {
      const fileName = path.split("/").pop();

      if (!fileName) {
        throw new Error(`Invalid asset path: ${path}`);
      }

      return [fileName, url];
    }),
  );
}

const playerSpriteUrlByFile = createFileNameUrlMap(playerSpriteUrls);
const carSpriteUrlByFile = createFileNameUrlMap(carSpriteUrls);

export class AssetManager {

  // Simple in-memory cache so repeated calls don't reload/resize
  private imageElementCache = new Map<string, HTMLImageElement>();
  private imageBitmapCache = new Map<string, ImageBitmap>(); // pre-scaled key

  private playerAssets!: PlayerAssets;
  private carAssets!: CarAssets;

  private constructor() {
  }

  static async create(pixSquareSize: number = 100) {
    const manager = new AssetManager();
    manager.playerAssets = await manager.loadPlayerAssets(pixSquareSize);
    manager.carAssets = await manager.loadCarAssets(pixSquareSize);
    return manager;
  }

  public getPlayerAssets(): PlayerAssets {
    return this.playerAssets;
  }

  public getCarAssets(): CarAssets {
    return this.carAssets;
  }

  private getPlayerSpriteUrl(file: string): string {
    const src = playerSpriteUrlByFile[file];
    if (!src) {
      throw new Error(`Player sprite not found: ${file}`);
    }
    return src;
  }

  private getCarSpriteUrl(file: string): string {
    const src = carSpriteUrlByFile[file];
    if (!src) {
      throw new Error(`Car sprite not found: ${file}`);
    }
    return src;
  }

  // loads source player movement PNGs and pre-scales to target pixel size (corresponds to pygame.transform.scale)
  private async loadPlayerAssets(pixSquareSize: number): Promise<PlayerAssets> {
    const directions: DirectionAction[] = [Action.UP, Action.DOWN, Action.RIGHT, Action.LEFT];
    // width/height ratio
    const sizeRatio: Record<string, [number, number]> = {
      "player_UP_0_cropped.png": [57, 73],
      "player_UP_1_cropped.png": [53, 69],
      "player_UP_2_cropped.png": [57, 73],
      "player_UP_3_cropped.png": [53, 69],

      "player_DOWN_0_cropped.png": [57, 73],
      "player_DOWN_1_cropped.png": [53, 69],
      "player_DOWN_2_cropped.png": [57, 73],
      "player_DOWN_3_cropped.png": [53, 69],

      "player_RIGHT_0_cropped.png": [49, 69],
      "player_RIGHT_1_cropped.png": [49, 65],
      "player_RIGHT_2_cropped.png": [49, 69],
      "player_RIGHT_3_cropped.png": [49, 65],

      "player_LEFT_0_cropped.png": [49, 69],
      "player_LEFT_1_cropped.png": [49, 65],
      "player_LEFT_2_cropped.png": [49, 69],
      "player_LEFT_3_cropped.png": [49, 65],
    };
    const images: PlayerAssets["images"] = {
      [Action.UP]: { [AgentStatus.ALIVE]: [null, null, null, null], [AgentStatus.DEAD]: [null, null, null, null] },
      [Action.DOWN]: { [AgentStatus.ALIVE]: [null, null, null, null], [AgentStatus.DEAD]: [null, null, null, null] },
      [Action.RIGHT]: { [AgentStatus.ALIVE]: [null, null, null, null], [AgentStatus.DEAD]: [null, null, null, null] },
      [Action.LEFT]: { [AgentStatus.ALIVE]: [null, null, null, null], [AgentStatus.DEAD]: [null, null, null, null] },
    };
    const sizes: PlayerAssets["sizes"] = {
      [Action.UP]: { [AgentStatus.ALIVE]: [[1, 1], [1, 1], [1, 1], [1, 1]], [AgentStatus.DEAD]: [[1, 1], [1, 1], [1, 1], [1, 1]] },
      [Action.DOWN]: { [AgentStatus.ALIVE]: [[1, 1], [1, 1], [1, 1], [1, 1]], [AgentStatus.DEAD]: [[1, 1], [1, 1], [1, 1], [1, 1]] },
      [Action.RIGHT]: { [AgentStatus.ALIVE]: [[1, 1], [1, 1], [1, 1], [1, 1]], [AgentStatus.DEAD]: [[1, 1], [1, 1], [1, 1], [1, 1]] },
      [Action.LEFT]: { [AgentStatus.ALIVE]: [[1, 1], [1, 1], [1, 1], [1, 1]], [AgentStatus.DEAD]: [[1, 1], [1, 1], [1, 1], [1, 1]] },
    };

    // Build all tasks (for parallelism)
    const loadTasks: Promise<void>[] = [];
    for (const direction of directions) {
      const dirStr = actionToString(direction);
      for (let i = 0; i < 4; i++) {
        for (const status of [AgentStatus.ALIVE, AgentStatus.DEAD] as const) {
          const file = `player_${dirStr}_${i}_cropped.png`;
          const [widthRatio, heightRatio] = sizeRatio[file];
          const agentGridHeight = (heightRatio / 140) * (status === AgentStatus.DEAD ? 0.4 : 1.0);
          const agentGridWidth = (widthRatio / 140) * (status === AgentStatus.DEAD ? 2.4 : 1.0);
          sizes[direction][status][i] = [agentGridWidth, agentGridHeight];

          const src = this.getPlayerSpriteUrl(file);
          const targetPxW = agentGridWidth * pixSquareSize;
          const targetPxH = agentGridHeight * pixSquareSize;
          const task = (async () => {
            const img = await this.loadHTMLImage(src);
            const cacheKey = `${src}@${Math.round(targetPxW)}x${Math.round(targetPxH)}`;
            const bitmap = await this.toPreScaledBitmap(img, targetPxW, targetPxH, cacheKey);
            images[direction][status][i] = bitmap;
          })();
          
          loadTasks.push(task);
        }
      }
    }
    await Promise.all(loadTasks);
    return { images, sizes };
  }

  private async loadCarAssets(pixSquareSize: number): Promise<CarAssets> {
    const loadTasks: Promise<void>[] = [];
    const carAssets = {} as CarAssets;
    for (const carGridHeight of [CarHeightType.SMALL, CarHeightType.LARGE] as const) {
      for (const [carType, ratio] of CAR_CANDIDATES[carGridHeight]) {
        carAssets[carType] = {} as Record<CarColorType, Record<CarDirection, CarDetails>>;
        for (const colorType of [CarColorType.GREEN, CarColorType.YELLOW, CarColorType.RED]) {
          carAssets[carType]![colorType] = {} as Record<CarDirection, CarDetails>;
          for (const direction of [CarDirection.GO_RIGHT, CarDirection.GO_LEFT]) {
            const risk = RiskDetails[colorType];
            const file = `${risk.colorName}_${carType}_CLEAN_${direction}_000_cropped.png`;
            const src = this.getCarSpriteUrl(file);

            const heightBuffer = 0.1;
            const gridHeight = carGridHeight - heightBuffer;
            const gridWidth = gridHeight * ratio;
            const widthPx = gridWidth * pixSquareSize;
            const heightPx = gridHeight * pixSquareSize;
            
            const task = (async () => {
              const img = await this.loadHTMLImage(src);
              const cacheKey = `${src}@${Math.round(widthPx)}x${Math.round(heightPx)}`;
              const image = await this.toPreScaledBitmap(img, widthPx, heightPx, cacheKey);
              carAssets[carType]![colorType][direction] = new CarDetails(
                carType,
                colorType,
                direction,
                gridWidth,
                gridHeight,
                widthPx,
                heightPx,
                image,
              );
            })();
            loadTasks.push(task);
          }
        }
      }
    }
    await Promise.all(loadTasks);
    return carAssets;
  }

  private loadHTMLImage(src: string): Promise<HTMLImageElement> {
    const cached = this.imageElementCache.get(src);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageElementCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }
  
  // Pre-scale like pygame.transform.scale
  private async toPreScaledBitmap(
    img: CanvasImageSource,
    w: number,
    h: number,
    cacheKey: string
  ): Promise<ImageBitmap> {
    const cached = this.imageBitmapCache.get(cacheKey);
    if (cached) return cached;

    const targetW = Math.max(1, Math.round(w));
    const targetH = Math.max(1, Math.round(h));

    const canUseOffscreen = typeof OffscreenCanvas !== "undefined" && "convertToBlob" in OffscreenCanvas.prototype;

    if (canUseOffscreen) {
      const off = new OffscreenCanvas(targetW, targetH);
      const anyCtx = off.getContext("2d");
      if (!anyCtx) throw new Error("Failed to get 2D context from OffscreenCanvas");
      if (!("drawImage" in anyCtx)) throw new Error("Non-2D Offscreen context returned");

      const ctx = anyCtx as OffscreenCanvasRenderingContext2D;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const bitmap = "transferToImageBitmap" in off
        ? off.transferToImageBitmap()
        : await createImageBitmap(off);

      this.imageBitmapCache.set(cacheKey, bitmap);
      return bitmap;
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const anyCtx = canvas.getContext("2d");
      if (!anyCtx) throw new Error("Failed to get 2D context from Canvas");

      const ctx = anyCtx as CanvasRenderingContext2D;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const bitmap = await createImageBitmap(canvas);
      this.imageBitmapCache.set(cacheKey, bitmap);
      return bitmap;
    }
  }
}
