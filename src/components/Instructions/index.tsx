import { useState } from "react";
import { styled } from "styled-components";

import TitlePage from "./TitlePage";
import ControlPage from "./ControlPage";
import UnreachablePage from "./UnreachablePage";
import GoalPage from "./GoalPage";
import BonusScorePage from "./BonusScorePage";
import TimeOverPage from "./TimeOverPage";
import GameOverPage from "./GameOverPage";
import CarSizesPage from "./CarSizesPage";
import CrosswalkActivationPage from "./CrosswalkActivationPage";

type TaskExplanationProps = {
  onClosePage: () => void;
  allowEarlyClose?: boolean;
};

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 24px;
  background: black;
  border: none;
  z-index: 100;
  color: white;
`;

const TaskExplanation = ({ onClosePage, allowEarlyClose }: TaskExplanationProps) => {
  const [page, setPage] = useState<number>(0);
  return <Wrapper>
    {allowEarlyClose && <CloseButton onClick={onClosePage}>X</CloseButton>}
    {page === 0 && <TitlePage onNext={() => setPage(page + 1)} />}
    {page === 1 && <ControlPage onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    {page === 2 && <UnreachablePage onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    {page === 3 && <GoalPage onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    {page === 4 && <TimeOverPage onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    {page === 5 && <BonusScorePage onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    {page === 6 && <GameOverPage onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    {page === 7 && <CarSizesPage onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    {page === 8 && <CrosswalkActivationPage onPrev={() => setPage(page - 1)} onClosePage={onClosePage} />}
  </Wrapper>
}

export default TaskExplanation;
