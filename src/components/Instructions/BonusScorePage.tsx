import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const BonusScorePage = ({ onNext, onPrev }: PageProps) => {
  return (
    <Wrapper>
      <h2><strong>Bonus score</strong></h2>
      <span>
        If the player succeeds in reaching the top of the map within 30 seconds, <strong>bonus score</strong> will be given in proportion to the amount of time left.
      </span>
      <br />
      <Image src="examples/bonus_score.png"/>
      <span>In the example image, bonus score of 500 (= 50 x 10 seconds) is added to basic score of 1200.</span>
      <br />
      <br />
      <ButtonWrapper>
        <Button onClick={onPrev}>Prev Page</Button>
        <Button onClick={onNext}>Next Page</Button>
      </ButtonWrapper>
    </Wrapper>
  );
}

export default BonusScorePage;
