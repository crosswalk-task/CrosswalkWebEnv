import { styled } from "styled-components";
import type { ImgHTMLAttributes } from "react";

const exampleImageModules = import.meta.glob(
  "../../assets/examples/*.{png,gif}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

const exampleImageUrlByPath = Object.fromEntries(
  Object.entries(exampleImageModules).map(([path, url]) => {
    const fileName = path.split("/").pop();

    if (!fileName) {
      throw new Error(`Invalid example image path: ${path}`);
    }

    return [`examples/${fileName}`, url];
  }),
) as Record<string, string>;

type ImageProps = ImgHTMLAttributes<HTMLImageElement>;

export const Image = styled.img.attrs<ImageProps>((props) => {
  if (!props.src) {
    return {};
  }
  const resolvedSrc = exampleImageUrlByPath[props.src];
  if (!resolvedSrc) {
    throw new Error(`Example image not found: ${props.src}.`);
  }
  return {
    src: resolvedSrc,
  };
})`
  display: block;
  margin: 10px auto;

  max-width: 100%;
  height: auto;
`;
