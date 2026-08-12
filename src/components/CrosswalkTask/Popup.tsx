import { useContext } from "react";
import { GameContext } from "../../context";
import { styled } from "styled-components";

import { TimeLeftHeader } from "./TimeLeftText"
import { ALERT_TIME_LEFT_SEC } from "../../constants";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 2fr 1fr 2fr;
  place-content: center;

  height: 100%;
  width: 100%;

  padding: 10px 25px;

  z-index: 80;

  font-weight: 800;
  white-space: nowrap;

  ${(props) => props.theme.preventSelect};
  color: ${(props) => props.theme.textColor};
  background-color: ${(props) => props.theme.blackOutBackgroundColor};

  span {
    font-size: 32px;
    @media ${(props) => props.theme.device.modeChange} {
      font-size: 40px;
    }
  }
`;

const EpisodeResult = styled.div`
  width: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  padding: 20px;
  @media ${(props) => props.theme.device.modeChange} {
    padding: 30px;
  }
`;

const ResultText = styled.span`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  span:first-child {
    font-size: 60px;
    @media ${(props) => props.theme.device.modeChange} {
      font-size: 120px;
    }
  }

  span:nth-child(2) {
    font-size: 48px;
    @media ${(props) => props.theme.device.modeChange} {
      font-size: 80px;
    }
  }
`;

const BonusText = styled(ResultText)`
  color: green;
`;

const RunOverText = styled(ResultText)`
  color: red;
`;

const TimeOverText = styled(ResultText)`
  color: blue;
`;

const ScoreContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  height: 100%;
  width: 100%;
`;

const ScoreTextWrapper = styled.div`
  display: grid;
  grid-template-columns: 2fr 6fr 2fr;
  grid-template-rows: auto auto auto;

  width: 100%;
`;

const ScoreTextBox = styled.div<{ color: string }>`
  display: flex;
  justify-content: space-between;

  width: 100%;
  padding-right: 10px;

  span {
    color: ${(props) => props.color};
  }
`;

export const Popup = () => {
  const { timeLeftSecView, episodeResultExtraScore, episodeScore, bestScore, isNewBestScore, totalScore } = useContext(GameContext);
  const cleared = episodeResultExtraScore > 0;
  const runOver = episodeResultExtraScore < 0;
  const timeOver = episodeResultExtraScore === 0;
  return (
    <Container>
      <TimeLeftHeader $isAlert={timeLeftSecView <= ALERT_TIME_LEFT_SEC}>Time Left: {timeLeftSecView} sec</TimeLeftHeader>
      <EpisodeResult>
        {cleared && (
          <BonusText>
            <span>BONUS</span>
            <span>+ {episodeResultExtraScore}</span>
          </BonusText>
        )}
        {runOver && (
          <RunOverText>
            <span>YOU DIED</span>
            <span>{episodeResultExtraScore}</span>
          </RunOverText>
        )}
        {timeOver && (
          <TimeOverText>
            <span>TIME OVER</span>
          </TimeOverText>
        )}
      </EpisodeResult>
      <ScoreContainer>
        <ScoreTextWrapper>
          <div></div>
          <ScoreTextBox color={cleared ? 'green' : (runOver ? 'red' : 'white')}>
            <span>Current Score:</span>
            <span>{episodeScore}</span>
          </ScoreTextBox>
          <div></div>

          <div></div>
          <ScoreTextBox color={(cleared && isNewBestScore) ? 'green' : 'white'}>
            <span>Best Score:</span>
            <span>{bestScore || 0}</span>
          </ScoreTextBox>
          {(cleared && isNewBestScore) ? (<span style={{ color: 'green' }}>(NEW!)</span>) : <div></div>}

          <div></div>
          <ScoreTextBox color={'white'}>
            <span>Total Score:</span>
            <span>{totalScore}</span>
          </ScoreTextBox>
          <div></div>
        </ScoreTextWrapper>
      </ScoreContainer>
    </Container>
  );
};
