import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    backgroundColor: string;
    textColor: string;

    wallColor: string;
    playerColor: string;
    finishColor: string;
    blackOutBackgroundColor: string;

    darkPurple: string;
    lightPurple: string;
    gray: string;

    device: {
      minimum: string;
      minimumHeight: string;
      modeChange: string;
    };

    preventSelect: FlattenSimpleInterpolation;
  }
}
