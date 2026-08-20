import { useState, useEffect, useRef } from "react";

import { ThemeProvider } from "styled-components";
import { theme } from "./styles/theme";
import { ResetStyle } from "./styles/reset";
import { GlobalStyle } from "./styles/global";

import CrosswalkTask from "./components/CrosswalkTask";
import TaskExplanation from "./components/Instructions";
import { BlackScreen } from "./components/common/BlackScreen";

import { Environment } from "./domains/Environment";
import { useGameLoop } from "./hooks/useGameLoop";
import { useViewport } from "./hooks/useViewport";
import { GameContext } from "./context";

export interface ExperimentPageProps {
  subjectId: number | string;
  sessionId: number; // default = 1
  maxEpisodes: number; // default = -1 (play forever)
  maxSeconds: number; // default = -1 (play forever)
  localSave: boolean; // default = false (set to true to automatically save episode results as zip files)
}

const validateArguments = (subjectId: number | string, sessionId: number, maxEpisodes: number, maxSeconds: number, localSave: boolean) => {
  if ((typeof subjectId !== "string" && typeof subjectId !== "number") || subjectId === null) {
    throw new TypeError(`subjectId must be a string or number, but received: ${String(subjectId)}`);
  }
  if (!Number.isInteger(sessionId) || sessionId < 1) {
    throw new Error(`sessionId must be a positive integer (1, 2, 3, ...), but received: ${String(sessionId)}`);
  }
  if (
    typeof maxEpisodes !== "number" ||
    !Number.isFinite(maxEpisodes) ||
    !Number.isInteger(maxEpisodes) ||
    (maxEpisodes < 1 && maxEpisodes !== -1)
  ) {
    throw new TypeError(`maxEpisodes must be -1 or a positive integer, but received: ${String(maxEpisodes)}`);
  }
  if (
    typeof maxSeconds !== "number" ||
    !Number.isFinite(maxSeconds) ||
    !Number.isInteger(maxSeconds) ||
    (maxSeconds < 1 && maxSeconds !== -1)
  ) {
    throw new TypeError(`maxSeconds must be -1 or a positive integer, but received: ${String(maxSeconds)}`);
  }
  if (maxEpisodes > 0 && maxSeconds > 0) {
    throw new TypeError(
      "At most one of maxEpisodes or maxSeconds can be a positive integer."
    );
  }

  if (typeof localSave !== "boolean") {
    throw new TypeError(`localSave must be a boolean, but received: ${String(localSave)}`);
  }
}

const ExperimentPage = ({ 
  subjectId = "anonymous",
  sessionId = 1,
  maxEpisodes = -1,
  maxSeconds = -1,
  localSave = false,
}: ExperimentPageProps) => {
  validateArguments(subjectId, sessionId, maxEpisodes, maxSeconds, localSave);

  const [taskExplanationOpen, setTaskExplanationOpen] = useState<boolean>(false);
  const { width: viewportWidth, height: viewportHeight } = useViewport();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [env, setEnv] = useState<Environment | null>(null);

  useEffect(() => {
    (async () => {
      const environment = await Environment.create(canvasRef, viewportWidth, viewportHeight);
      setEnv(environment);
    })();
    return;
  }, [viewportWidth, viewportHeight]);

  useEffect(() => {
    env?.updateBrowserResizing(viewportWidth, viewportHeight)
  }, [env, viewportWidth, viewportHeight]);

  const {
    timeLeftSecView,
    episodeOver,
    setEpisodeOver,
    episodeScore,
    episodeResultExtraScore,
    bestScore,
    isNewBestScore,
    totalScore,
    totalFinishedEpisodeCnt,
    totalTimePassedMs,
    episodeResultQueue,
    removeEpisodeResult,
    startGame,
    endGame,
   } = useGameLoop(env);

  if (env === null) {
    return <div>Loading...</div>;
  }
  const contextObj = {
    env,
    timeLeftSecView,
    episodeOver,
    setEpisodeOver,
    episodeScore,
    episodeResultExtraScore,
    bestScore,
    isNewBestScore,
    totalScore,
    totalFinishedEpisodeCnt,
    totalTimePassedMs,
    episodeResultQueue,
    removeEpisodeResult,
    startGame,
    endGame,
  };
  return (
    <ThemeProvider theme={theme}>
      <ResetStyle />
      <GlobalStyle />
      <GameContext.Provider value={contextObj}>
        {taskExplanationOpen ? (
          <TaskExplanation
            allowEarlyClose
            onClosePage={() => setTaskExplanationOpen(false)}
          />
        ) : (
          <CrosswalkTask
            subjectId={subjectId}
            sessionId={sessionId}
            initialSeed={sessionId * 1000}
            maxEpisodes={maxEpisodes}
            maxSeconds={maxSeconds}
            localSave={localSave}
            openTaskExplanation={() => setTaskExplanationOpen(true)}
          />
        )}

        <BlackScreen />
      </GameContext.Provider>
    </ThemeProvider>
  );
};

export default ExperimentPage;
