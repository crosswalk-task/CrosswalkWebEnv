import { styled } from "styled-components";

// NOTE: height=99vh to prevent scroll bar in some browsers
// NOTE: check calculateSize method in Environment
const BlackPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  height: 99vh;
  padding: 15px;

  font-weight: 400;

  color: ${(props) => props.theme.textColor};
  background-color: ${(props) => props.theme.backgroundColor};

  ${(props) => props.theme.preventSelect};
`;

export default BlackPageWrapper;
