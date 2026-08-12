import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const ControlPage = ({ onNext, onPrev }: PageProps) => {
  return (
    <Wrapper>
      <h2><strong>Controls</strong></h2>
      <span>
        In the task, you can control the player to move around the map.
      </span>
      <br />
      <br />
      <span>
        The player can move UP, DOWN, LEFT, or RIGHT.
      </span>
      <Image src="examples/control.png"/>
      <span>
        You can control the player using the <strong>arrow keys</strong> or the <strong>WASD keys</strong> on the keyboard.
      </span>
      <br />
      <br />
      <span>
        Note that you must <strong>keep the key pressed</strong> until the player reaches the desired position, instead of just tapping it.
      </span>
      <br />
      <br />
      {/* <span>
        If you don't press any keys, time will pass and the cars on the map will keep on moving.
      </span> */}
      <ButtonWrapper>
        <Button onClick={onPrev}>Prev Page</Button>
        <Button onClick={onNext}>Next Page</Button>
      </ButtonWrapper>
    </Wrapper>
  );
}

export default ControlPage;
