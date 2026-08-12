import { styled } from "styled-components";

export const BlackScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;

  z-index: 99;

  text-align: center;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  height: 100%;
  width: 100%;

  background-color: ${(props) => props.theme.blackOutBackgroundColor};

  @media ${(props) => props.theme.device.minimum} and ${(props) => props.theme.device.minimumHeight} {
    display: none;
  }
`;

export const WarningText = styled.span`
  font-weight: 800;
  font-size: 20px;
  color: white;
`;

export const BlackScreen = () => {
  return (
    <BlackScreenContainer>
      <WarningText>Your Screen</WarningText>
      <WarningText>Is Too Small!</WarningText>
    </BlackScreenContainer>
  );
};
