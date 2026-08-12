import { useState, useEffect, useContext } from "react";
import { styled } from "styled-components";

import Task from "./Task";
import BlackPageWrapper from "../common/BlackPageWrapper"
import { useEpisodeResultLocalSave } from "../..//hooks";
import { GameContext } from "../../context";

const Header = styled.h1`
  margin-bottom: 20px;
  text-align: center;
  font-size: 36px;
  @media ${(props) => props.theme.device.modeChange} {
    font-size: 40px;
  }
`

const Text = styled.span`
  width: 80%;
  text-align: left;
  line-height: 1.4;
  font-size: 20px;
  @media ${(props) => props.theme.device.modeChange} {
    font-size: 24px;
  }
`;

const Button = styled.button`
  padding: 20px;
  margin: 20px 40px;
  width: fit-content;
  font-size: 28px;
  background-color: white;
  color: black;
  border-width: 0px;
  border-radius: 30px;
  @media ${(props) => props.theme.device.modeChange} {
    font-size: 32px;
  }

  &: hover {
    color: white;
  }
`

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
`

interface iCrosswalkTask {
  subjectId: number | string;
  sessionId: number | string;
  initialSeed?: number;
  maxSeconds: number;
  localSave: boolean;
  openTaskExplanation?: () => void;
  handleSessionEnd?: () => void;
}

const CrosswalkTask = ({ 
  subjectId, 
  sessionId,
  initialSeed,
  maxSeconds,
  localSave,
  openTaskExplanation,
  handleSessionEnd 
}: iCrosswalkTask) => {
  const { 
    env,
    startGame,
    endGame,
  } = useContext(GameContext);
  const [isOngoingSession, setIsOngoingSession] = useState(false);

  useEpisodeResultLocalSave(subjectId, sessionId, localSave);
  const handleStart = () => {
    if (!env) return;
    startGame(initialSeed || 0);
    setIsOngoingSession(true);
  };

  useEffect(() => {
    // NOTE: isOngoingSession is automatically set to false after playing over maxSeconds
    return () => {
      if (isOngoingSession) {
        endGame();
        handleSessionEnd?.();
      }
    };
  }, [isOngoingSession, endGame, handleSessionEnd]);

  return (
    <>
      {!isOngoingSession && (
        <BlackPageWrapper>
          <Header>Crosswalk Task</Header>
          <br />
          {(maxSeconds > 0) && <Text>You will now play the task for {maxSeconds / 60} minutes.</Text>}
          <br />
          <Text>(1) Once the task starts, you cannot pause it. Please go to the bathroom beforehand and make sure you are comfortable.</Text>
          <Text>(2) You must use a desktop or laptop computer.</Text>
          <Text>(3) Make sure you have a strong internet connection and a reliable power source.</Text>
          <br />
          <Text>Please review the task instructions again if anything is unclear.</Text>
          <br />
          <ButtonWrapper
          >
           {openTaskExplanation && <Button onClick={openTaskExplanation}>Instructions</Button>}
            <Button onClick={handleStart}>Start Game</Button>
          </ButtonWrapper>
        </BlackPageWrapper>
      )}
      {isOngoingSession && <Task maxSeconds={maxSeconds} setIsOngoingSession={setIsOngoingSession} />}
    </>
  );
};

export default CrosswalkTask;
