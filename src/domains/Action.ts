export enum Action {
  NOTHING = 0,
  UP = 1,
  DOWN = 2,
  RIGHT = 3,
  LEFT = 4,
}

export type DirectionAction = Action.UP | Action.DOWN | Action.LEFT | Action.RIGHT;

export function actionToString(action: Action): string {
  return _ACTION_TO_STRING[action];
}

const _ACTION_TO_STRING: Record<Action, string> = {
  [Action.NOTHING]: "Nothing",
  [Action.UP]: "UP",
  [Action.DOWN]: "DOWN",
  [Action.RIGHT]: "RIGHT",
  [Action.LEFT]: "LEFT",
};

export const ACTION_TO_DELTA: Record<Action, [number, number]> = {
  [Action.NOTHING]: [0, 0],
  [Action.UP]: [0, -1],
  [Action.DOWN]: [0, 1],
  [Action.RIGHT]: [1, 0],
  [Action.LEFT]: [-1, 0],
};

export const ACTION_DURATION: Record<Action, number> = {
  [Action.NOTHING]: 1,
  [Action.UP]: 4,
  [Action.DOWN]: 4,
  [Action.RIGHT]: 4,
  [Action.LEFT]: 4,
};
