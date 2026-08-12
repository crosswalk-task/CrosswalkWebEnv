import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const UnreachablePage = ({ onNext, onPrev }: PageProps) => {
  return (
    <Wrapper>
      <h2><strong>Unreachable Area</strong></h2>
      <span>
        The dark areas at the end of the map are unreachable.
      </span>
      <br />
      <br />
      <span>
        You can see the cars that are moving, but the player can not reach the area.
      </span>
      <br />
      <Image src="examples/unreachable.png"/>
      <ButtonWrapper>
        <Button onClick={onPrev}>Prev Page</Button>
        <Button onClick={onNext}>Next Page</Button>
      </ButtonWrapper>
    </Wrapper>
  );
}

export default UnreachablePage;
