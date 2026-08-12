import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const GameOverPage = ({ onNext, onPrev }: PageProps) => {
  return (
    <Wrapper>
      <h2><strong>Game over</strong> and <strong>Penalty</strong></h2>
      <Image src="examples/road_descriptions.png" />
      <span>
        The dark tiles are <strong>roads</strong> where cars can appear.
      </span>
      <br />
      <br />
      <span>
        Note that each road is full of cars with the same color.
      </span>      
      <br />
      <br />
      <Image src="examples/game_over_with_penalty.png"/>
      <span>
        When the player makes contact with a car, the game ends with a <strong>Game Over</strong>.
      </span>
      <br />
      <br />
      <span>
        In a <strong>Game Over</strong>, the game ends immediately with a penalty depending on the color of the car.
      </span>
      <br />
      <br />
      <span>
        All cars have one of three colors that correspond to traffic light colors: <strong>Green</strong>, <strong>Yellow</strong>, <strong>Red</strong>
      </span>
      <br />
      <br />
      <span>
        <strong>Green</strong> has the lowest penalty (100 = safe), whereas <strong>Red</strong> has the highest penalty (1000 = dangerous). 
      </span>
      <br />
      <br />
      <ButtonWrapper>
        <Button onClick={onPrev}>Prev Page</Button>
        <Button onClick={onNext}>Next Page</Button>
      </ButtonWrapper>
    </Wrapper>
  );
}

export default GameOverPage;
