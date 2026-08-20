import { useEffect, useContext } from "react";
import { styled } from "styled-components";

import { Popup } from "./Popup";
import { GameContext } from "../../context";
import { TimeLeftHeader } from "./TimeLeftText"
import { ALERT_TIME_LEFT_SEC, GAME_OVER_SCREEN_MS } from "../../constants";

// NOTE: height=99vh to prevent scroll bar in some browsers
// NOTE: check calculateSize method in Environment
const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  place-content: center;

  height: 99vh;
  padding: 15px;

  font-weight: 400;
  white-space: nowrap;

  color: ${(props) => props.theme.textColor};
  background-color: ${(props) => props.theme.backgroundColor};

  ${(props) => props.theme.preventSelect};

  .ingame_text {
    font-size: 24px;
    @media ${(props) => props.theme.device.modeChange} {
      font-size: 32px;
    }
  }
`;

const CanvasWrapper = styled.div`
  position: relative;

  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;  
`;

const ScoreTextBox = styled.div`
  display: flex;
  justify-content: space-between;
`;

interface iTask {
  maxSeconds: number;
  setIsOngoingSession: (isRunning: boolean) => void;
}

const Task = ({ maxSeconds, setIsOngoingSession }: iTask) => {
  const { 
    env,
    timeLeftSecView,
    episodeOver,
    setEpisodeOver,
    episodeScore,
    bestScore,
    totalScore,
    totalTimePassedMs,
  } = useContext(GameContext);
  const canvasRef = env.getCanvasRef();

  useEffect(() => {
    if (episodeOver) {
      const closePopUp = setTimeout(() => {
        setEpisodeOver(false);
        // NOTE: run forever if maxSeconds < 0
        if ((maxSeconds > 0) && (maxSeconds * 1000 <= totalTimePassedMs)) {
          setIsOngoingSession(false);
        }
      }, GAME_OVER_SCREEN_MS);
      return () => clearTimeout(closePopUp); // return a function in the useEffect callback and that function will run when the component unmounts
    }
  }, [episodeOver]);

  return (
    <Wrapper>
        {!episodeOver && <TimeLeftHeader className="ingame_text" $isAlert={timeLeftSecView <= ALERT_TIME_LEFT_SEC}>Time Left: {timeLeftSecView} sec</TimeLeftHeader>}
        <CanvasWrapper>
        <canvas ref={canvasRef} />
        {episodeOver && <Popup />}
        </CanvasWrapper>
        {!episodeOver && (
        <ScoreTextBox className="ingame_text">
            <span>Best Score: {bestScore || 0}</span>
            <span>Current Score: {episodeScore}</span>
            <span>Total Score: {totalScore}</span>
        </ScoreTextBox>
        )}
    </Wrapper>
  );
};

export default Task;
