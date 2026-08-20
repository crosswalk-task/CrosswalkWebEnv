import { useEffect, useRef, useState, useCallback } from "react";
import { Action } from "../domains/Action";
import { EPISODE_DURATION_MS } from "../constants";
import { iEpisodeResult } from "../types"

const RENDER_FPS = 120;
const RENDER_MS = 1000 / RENDER_FPS;

type Key = string;

interface iState {
  obs: number[];
  playInfo: object;
}

interface iEnvironment {
  getEpisodeSeed: () => number;
  setEpisodeSeed: (seed: number) => void;
  reset: () => object;
  triggerAction: (action: Action) => number; // actionDurationMs
  updateTargetReached: (timeLeft: number) => boolean;
  getPrevActionResult: () => { cumRewards: number, episodeResult: number, timeLeftSec: number };
  updatePosition: (dt: number) => void;
  getMiniStepMs: () => number;
  updateEveryMiniStep: (timeLeftMs: number) => void;
  setEpisodeOver: (episodeOver: boolean) => void;
  getEpisodeResultExtraScore: () => number;
  render: () => void;
  updateAndGetState: () => iState;
};

interface iEpisodeStates { 
  obs_list: number[][];
  actions: number[];
  rewards: number[];
  cumReward: number;
  playInfos: object[];
  episodeMetadata: object;
}

const keyboardInputToAction: Record<Key, Action> = {
  "w": Action.UP,
  "W": Action.UP,
  "ArrowUp": Action.UP,

  "s": Action.DOWN,
  "S": Action.DOWN,
  "ArrowDown": Action.DOWN,

  "a": Action.LEFT,
  "A": Action.LEFT,
  "ArrowLeft": Action.LEFT,

  "d": Action.RIGHT,
  "D": Action.RIGHT,
  "ArrowRight": Action.RIGHT,
}

export const useGameLoop = (env: iEnvironment | null) => {
  const [timeLeftSecView, setTimeLeftSecView] = useState(EPISODE_DURATION_MS); // view-only
  const timeLeftSecViewRef = useRef(timeLeftSecView);

  const [episodeOver, _setEpisodeOver] = useState(false);
  const episodeOverRef = useRef(episodeOver);
  const episodeStartedRef = useRef(false);
  const episodeStatesRef = useRef<iEpisodeStates>({ obs_list: [], actions: [], rewards: [], cumReward: 0, playInfos: [], episodeMetadata: {} });
  const [episodeScore, setEpisodeScore] = useState(0);
  const [episodeResultExtraScore, setEpisodeResultExtraScore] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isNewBestScore, setIsNewBestScore] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [totalTimePassedMs, setTotalTimePassedMs] = useState(0);

  const accDtRef = useRef(0);
  const stepAccMsRef = useRef(0);
  const miniStepAccMsRef = useRef(0);
  const episodeStartTsRef = useRef(0);
  const updatePosAccDtRef = useRef(0);
  const lastAccTotalTimePassedRef = useRef(0);

  const reqIdRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const runningRef = useRef(false);
  const [episodeResultQueue, _setEpisodeResultQueue] = useState<iEpisodeResult[]>([]);

  useEffect(() => {
    timeLeftSecViewRef.current = timeLeftSecView;
  }, [timeLeftSecView]);

  useEffect(() => {
    episodeOverRef.current = episodeOver;
  }, [episodeOver]);
  const setEpisodeOver = (isOver: boolean) => {
    env?.setEpisodeOver(isOver);
    _setEpisodeOver(isOver);
    episodeOverRef.current = isOver;
    if (isOver) {
      if (reqIdRef.current !== null) {
        cancelAnimationFrame(reqIdRef.current);
        reqIdRef.current = null;
      }
    }
  };

  const enqueueEpisodeResult = (newResult: iEpisodeResult) => _setEpisodeResultQueue(prev => [...prev, newResult]);
  const removeEpisodeResult = () => {
    if (episodeResultQueue.length > 0) {
      _setEpisodeResultQueue(prev => prev.slice(1));
    }
  };

  const lastActionRef = useRef<Action>(Action.NOTHING);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!runningRef.current || episodeOverRef.current) {
        lastActionRef.current = Action.NOTHING; return;
      }
      if (e.key in keyboardInputToAction) {
        lastActionRef.current = keyboardInputToAction[e.key];
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!runningRef.current || episodeOverRef.current) {
        lastActionRef.current = Action.NOTHING; return;
      }
      if (e.key in keyboardInputToAction && lastActionRef.current === keyboardInputToAction[e.key]) {
        lastActionRef.current = Action.NOTHING;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const tick = useCallback(function tick(accTotalTimePassed: number) {
    if (!env || !startedRef.current) return;

    // reset and start new episode
    if (!episodeOverRef.current && !episodeStartedRef.current) {
      resetEpisodeRefs();
      episodeStartedRef.current = true;
      episodeStartTsRef.current = accTotalTimePassed;
      const episodeMetadata = env.reset();
      episodeStatesRef.current = { obs_list: [], actions: [], rewards: [], cumReward: 0, playInfos: [], episodeMetadata: episodeMetadata }
      setTimeLeftSecView(Math.floor(EPISODE_DURATION_MS / 1000));
      setIsNewBestScore(false);
    }

    const dt = lastAccTotalTimePassedRef.current === 0 ? 0 : accTotalTimePassed - lastAccTotalTimePassedRef.current;
    lastAccTotalTimePassedRef.current = accTotalTimePassed;

    setTotalTimePassedMs((prev) => prev + dt); // setTotalTimePassedMs(() => accTotalTimePassed - episodeStartTsRef.current);
    accDtRef.current += dt;
    stepAccMsRef.current += dt;
    miniStepAccMsRef.current += dt;
    updatePosAccDtRef.current += dt;

    // short-term updates
    const miniStep = env.getMiniStepMs()
    while (miniStepAccMsRef.current >= miniStep) {
      miniStepAccMsRef.current -= miniStep;
      const episodeTimePassed = accTotalTimePassed - episodeStartTsRef.current;
      const timeLeftMs = Math.max(0, (EPISODE_DURATION_MS - episodeTimePassed));
      env.updateEveryMiniStep(timeLeftMs);
      if (episodeStartedRef.current) {
        const timeLeftSec = Math.floor(timeLeftMs / 1000);
        setTimeLeftSecView(timeLeftSec);
      }
    }

    // apply user input
    while (stepAccMsRef.current >= 0 && episodeStartedRef.current) {
      const targetReached = env.updateTargetReached(timeLeftSecViewRef.current);
      if (targetReached || episodeOverRef.current) {
        break;
      }
      const prevState = env.updateAndGetState();
      episodeStatesRef.current.obs_list.push(prevState.obs);
      episodeStatesRef.current.playInfos.push(prevState.playInfo);
    
      const { cumRewards } = env.getPrevActionResult();
      if (episodeStatesRef.current.actions.length > 0) {
        // NOTE: add the reward of previous action after initial action.
        episodeStatesRef.current.rewards.push(cumRewards - episodeStatesRef.current.cumReward);
      }
      setEpisodeScore(cumRewards);
      episodeStatesRef.current.cumReward = cumRewards;

      const actionDurationMs = env.triggerAction(lastActionRef.current);
      episodeStatesRef.current.actions.push(lastActionRef.current);
      stepAccMsRef.current -= actionDurationMs;
    }

    // update and render
    while (accDtRef.current >= RENDER_MS) {
      env.updatePosition(updatePosAccDtRef.current);
      updatePosAccDtRef.current = 0;
      env.render();
      accDtRef.current -= RENDER_MS;
    }

    // set episode result
    if (!episodeOverRef.current) {
      const { cumRewards, episodeResult, timeLeftSec } = env.getPrevActionResult();
      if (timeLeftSec === 0 || episodeResult !== 0) {
        setEpisodeOver(true);
        setEpisodeResultExtraScore(episodeResult);
        episodeStartedRef.current = false;

        setEpisodeScore(cumRewards);
        setBestScore((prev) => {
          if (prev === null || prev < cumRewards) {
            setIsNewBestScore(true);
            return cumRewards;
          } else {
            setIsNewBestScore(false);
            return prev
          }
        });
        setTotalScore(prev => prev + cumRewards);

        const lastState = env.updateAndGetState();
        episodeStatesRef.current.obs_list.push(lastState.obs);
        episodeStatesRef.current.playInfos.push(lastState.playInfo);
        episodeStatesRef.current.rewards.push(cumRewards - episodeStatesRef.current.cumReward);

        enqueueEpisodeResult({
          episodeSeed: env.getEpisodeSeed(),
          obsList: episodeStatesRef.current.obs_list,
          actions: episodeStatesRef.current.actions,
          rewards: episodeStatesRef.current.rewards,
          playInfos: episodeStatesRef.current.playInfos,
          episodeMetadata: episodeStatesRef.current.episodeMetadata,
        });
      }
    }

    if (runningRef.current) {
      reqIdRef.current = requestAnimationFrame(tick);
    } else {
      reqIdRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env]);

  const resetEpisodeRefs = useCallback(() => {
    accDtRef.current = 0;
    stepAccMsRef.current = 0;
    miniStepAccMsRef.current = 0;
    updatePosAccDtRef.current = 0;

    lastAccTotalTimePassedRef.current = 0;
    lastActionRef.current = Action.NOTHING;
    episodeStartedRef.current = false;
    episodeStartTsRef.current = 0;
    episodeOverRef.current = false;
  }, []);

  const startGame = useCallback((initialSeed: number) => {
    if (!env || startedRef.current) return;
    if (initialSeed >= 0) {
      env.setEpisodeSeed(initialSeed);
    }
    startedRef.current = true;
    runningRef.current = true;
    resetEpisodeRefs();
    reqIdRef.current = requestAnimationFrame(tick);
  }, [tick, env, resetEpisodeRefs]);

  const endGame = useCallback(() => {
    runningRef.current = false;
    if (reqIdRef.current !== null) cancelAnimationFrame(reqIdRef.current);
    reqIdRef.current = null;
    startedRef.current = false;
    resetEpisodeRefs();

    episodeOverRef.current = false;
    setTimeLeftSecView(EPISODE_DURATION_MS / 1000);
    setEpisodeScore(0);
    setEpisodeResultExtraScore(0);
    setIsNewBestScore(false);

    setBestScore(null);
    setTotalScore(0);
    setTotalTimePassedMs(0);
  }, [resetEpisodeRefs]);

  return {
    timeLeftSecView,
    episodeOver,
    setEpisodeOver,
    episodeScore,
    episodeResultExtraScore,
    bestScore,
    isNewBestScore,
    totalScore,
    totalTimePassedMs,
    episodeResultQueue,
    removeEpisodeResult,
    startGame,
    endGame,
  };
}
