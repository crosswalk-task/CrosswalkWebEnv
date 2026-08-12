import { styled } from "styled-components";

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

export const Button = styled.button`
  height: 70px;
  line-height: 0;
  border-width: 0;
  border-radius:60px;
  background-color: #797979ff;
  box-shadow: 1px 1px 3px gray;
  padding: 12px 28px;
  font-size: 20px;
  font-weight: 100;
  @media ${(props) => props.theme.device.modeChange} {
    font-size: 28px;
  }
`
