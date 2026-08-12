import { DefaultTheme } from "styled-components";
import { PreventSelect } from "./preventSelect";

const width = {
  minimum: "600px",
  modeChange: "1000px",
};

const height = {
  minimum: "400px",
};

export const theme: DefaultTheme = {
  textColor: "#ffffff",
  backgroundColor: "#000000",
  wallColor: "#c8d6e5",
  playerColor: "#ff0000",
  finishColor: "#0036e7",
  blackOutBackgroundColor: "rgba(0, 0, 0, 0.8)",

  darkPurple: "#552b85",
  lightPurple: "#8768aa",
  gray: "#535353ff",

  device: {
    minimum: `(min-width: ${width.minimum})`,
    minimumHeight: `(min-height: ${height.minimum})`,
    modeChange: `(min-width: ${width.modeChange})`,
  },

  preventSelect: PreventSelect,
};
