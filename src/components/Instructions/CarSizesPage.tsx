import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const CarSizesPage = ({ onNext, onPrev }: PageProps) => {
  return (
    <Wrapper>
      <h2><strong>Car diversity</strong></h2>
      <span>
        Cars can have different sizes and speeds.
      </span>
      <br />
      <Image src="examples/small_cars.png" />
      <span>
        Small cars can have one of 15 shapes with different widths.
      </span>
      <br />
      <br />
      <span>
        Small cars cover up only <strong>one lane</strong>, so being in the same lane is dangerous.
      </span>
      <br />
      <Image src="examples/big_cars.png"/>
      <span>
        Big cars can have one of 4 shapes with different widths.
      </span>
      <br />
      <br />
      <span>
        Big cars cover up <strong>two lanes</strong>, so being inside of either lane is dangerous.
      </span>
      <br />
      <br />
      <span>
        The red boxes surrounding the cars and the player are <strong>hitboxes</strong> and the game ends if they contact.
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

export default CarSizesPage;
