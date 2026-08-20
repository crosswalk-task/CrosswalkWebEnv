import { createContext } from "react";
import { Environment } from "./domains/Environment";
import { iEpisodeResult } from "./types"

export interface iGameContext {
  env: Environment;
  timeLeftSecView: number;
  episodeOver: boolean;
  setEpisodeOver: (value: boolean) => void;
  episodeScore: number;
  episodeResultExtraScore: number;
  bestScore: number | null;
  isNewBestScore: boolean;
  totalScore: number;
  totalTimePassedMs: number;
  episodeResultQueue: iEpisodeResult[];
  removeEpisodeResult: () => void;  
  startGame: (initialSeed: number) => void;
  endGame: () => void;
}

export const GameContext = createContext<iGameContext>({
  env: {} as Environment,
  timeLeftSecView: 0,
  episodeOver: false,
  setEpisodeOver: () => {},
  episodeScore: 0,
  episodeResultExtraScore: 0,
  bestScore: 0,
  isNewBestScore: false,
  totalScore: 0,
  totalTimePassedMs: 0,
  episodeResultQueue: [],
  removeEpisodeResult: () => {},
  startGame: () => {},
  endGame: () => {},
});
