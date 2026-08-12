import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const TimeOverPage = ({ onNext, onPrev }: PageProps) => {
  return (
    <Wrapper>
      <h2><strong>Basic score</strong> and <strong>Time Limit</strong></h2>
      <span>Small amount of score is given in proportion to how much the player approached the goal.</span>
      <br />
      <br />
      <span>
        The player has <strong>30 seconds</strong> to reach the top of the map.
      </span>
      <br />
      <br />
      <span>
        Failure to clear the game within the time limit results in a <strong>Time Over</strong>.
      </span>
      <br />
      <Image src="examples/time_over.png"/>
      <span>In the example image, the game ended with basic score of 450.</span>
      <br />
      <br />
      <span>No penalty or bonus score is given for <strong>Time Over</strong>.</span>
      <br />
      <br />
      <ButtonWrapper>
        <Button onClick={onPrev}>Prev Page</Button>
        <Button onClick={onNext}>Next Page</Button>
      </ButtonWrapper>
    </Wrapper>
  );
}

export default TimeOverPage;
