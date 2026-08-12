import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const GoalPage = ({ onNext, onPrev }: PageProps) => {
  return (
    <Wrapper>
      <h2><strong>Goal</strong></h2>
      <span>
        The player starts from the <strong>bottom</strong> of the map.
      </span>
      <br />
      <br />
      <span>
        The goal of the task is to reach the <strong>top</strong> of the map as fast as possible.
      </span>
      <br />
      <Image src="examples/start_goal.png"/>
      <ButtonWrapper>
        <Button onClick={onPrev}>Prev Page</Button>
        <Button onClick={onNext}>Next Page</Button>
      </ButtonWrapper>
    </Wrapper>
  );
}

export default GoalPage;
