import { TextElement } from "@core/types";

const utilCanvas = document.createElement("canvas");

export function getTextElementCssStyles(element: TextElement) {
  const styles: React.CSSProperties = {
    background: "none",
    border: "none",
    color: element.fill,
    font: "10px sans-serif",
    padding: 0,
    margin: 0,
    display: "inline-block",
    lineHeight: 1
  };

  return styles;
}

export function getTextDimensionsForElement(
  text: string,
  element: TextElement,
) {
  const ctx = utilCanvas.getContext("2d")!;
  const lines = text.split("/n");
  const fontSize = 10;

  const h = lines.length * fontSize;
  let w = 0;

  ctx.save();
  for (let i = 0; i < lines.length; i += 1) {
    const { width } = ctx.measureText(lines[i]);
    w = Math.max(w, width);
  }
  ctx.restore();

  return { w, h };
}
