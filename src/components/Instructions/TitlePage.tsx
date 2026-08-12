import Wrapper from "../common/Wrapper";
import { ButtonWrapper, Button } from "../common/Button";
import { Image } from "../common/Image";
import { PageProps } from "../common/types";

const TitlePage = ({ onNext }: PageProps) => {
  return (
    <Wrapper>
      <div className="padding-div">
      <h1><strong>Crosswalk Task</strong></h1>
        <span>
          In our experiment, you will be playing the Crosswalk task.
        </span>
        <br />
        <br />
        <span>
          Make sure you are participating in the experiment using a <strong>desktop or laptop computer</strong>.
        </span>
        <br />
        <br />
        <span>
          Read the explanations carefully to understand the task.
        </span>
      <br /> <br />
      <Image src="examples/ingame.png"/>
      <ButtonWrapper>
        <div></div>
        <Button onClick={onNext}>Next Page</Button>
      </ButtonWrapper>
      </div>
    </Wrapper>
  );
}

export default TitlePage;
