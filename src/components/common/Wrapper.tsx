import { styled } from "styled-components";

const Wrapper = styled.div`
  padding: 70px;

  font-weight: 400;

  // color: ${(props) => props.theme.textColor};
  // background-color: ${(props) => props.theme.backgroundColor};

  ${(props) => props.theme.preventSelect};

  font-size: 20px;
  @media ${(props) => props.theme.device.modeChange} {
    font-size: 24px;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 20px;
  }
  h1 {
    text-align: center;
    font-size: 36px;
    @media ${(props) => props.theme.device.modeChange} {
      font-size: 40px;
    }
  }
  h2 {
    font-size: 24px;
    @media ${(props) => props.theme.device.modeChange} {
      font-size: 28px;
    }
  }
  h3 {
    font-size: 20px;
    @media ${(props) => props.theme.device.modeChange} {
      font-size: 24px;
    }
  }

  strong {
    font-weight: 800;
  }

  .padding-div {
    @media (min-width: 950px) {
      padding: 0px 100px;
    }

    @media (min-width: 1200px) {
      padding: 0px 130px;
    }
    @media (min-width: 1300px) {
      padding: 0px 160px;
    }
  }
`;

export default Wrapper;
