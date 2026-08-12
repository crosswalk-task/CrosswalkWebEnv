import { styled } from "styled-components";

export const TimeLeftHeader = styled.span<{ $isAlert: boolean }>`
  text-align: right;
  color: ${(props) => (props.$isAlert ? 'red' : props.theme.textColor)};
`;
