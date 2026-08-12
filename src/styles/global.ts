import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
                 Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Arial, sans-serif;
  }

  h1 {
    line-height: 1.3;
  }

  h2 {
    padding: 10px;
    line-height: 1.3;
    font-weight: 500;
    color: #333;
  }

  p {
    padding: 20px;
    color: #323232ff;
    line-height: 1.4;
    font-size: 18px;
    /* border-top: 1px solid #e0e0e0; */
    white-space: pre-line;
  }

  button, input[type="button"] {
    color: #ffffffff;
    cursor: pointer;

    &:hover {
      background-color: ${(props) => props.theme.gray};
    }
    
    &:active{
      background-color: ${(props) => props.theme.lightPurple};
      border-color: ${(props) => props.theme.lightPurple};
    }

    &:focus {
      outline: none;
      background-color: ${(props) => props.theme.lightPurple};
      border-color: ${(props) => props.theme.lightPurple};
    }
  }

  .break-word {
    word-break: break-word;
  }
`;
