import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const CrosswalkActivationPage = ({ onPrev, onClosePage }: PageProps) => {
  return (
    <Wrapper>
      <h2><strong>How to use a Crosswalk</strong></h2>
      <span>
        Each road can have at most one crosswalk. Some roads have a crosswalk, while others do not.
      </span>
      <br />
      <br />
      <span>
        Standing <strong>in front or inside of a crosswalk</strong> will activate the crosswalk.
      </span>
      <br />
      <br />
      <span>
        When the crosswalk is activated, <strong>cars will stop in front of the crosswalk</strong> and wait for the player to cross the road safely.
      </span>
      <br />
      <Image src="examples/crosswalk_activation.gif" />
      <span>
        Note that cars that arrive at the crosswalk check whether it is activated and decide whether to stop.
      </span>
      <br />
      <br />
      <span>
        Therefore, cars that are already on an activated crosswalk will continue moving forward to clear the player's path as quickly as possible.
      </span>      
      <br />
      <br />
      <ButtonWrapper>
        <Button onClick={onPrev}>Prev Page</Button>
        <Button onClick={onClosePage}>Close</Button>
      </ButtonWrapper>
    </Wrapper>
  );
}

export default CrosswalkActivationPage;
