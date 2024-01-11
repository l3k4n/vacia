/* eslint-disable no-param-reassign */
import { ELEMENT_PRECISION } from "@constants";
import {
  AppState,
  CanvasElement,
  TextElement,
  Mutable,
  TransformingElement,
} from "@core/types";
import { deepClone } from "@core/utils";

const utilCanvas = document.createElement("canvas");

/* returns the css properties required to make a DOM node visually resemble
 * a Text Element excluding position */
export function getTextElementCssStyles(element: TextElement) {
  // prevent the size from being 0
  const height = Math.max(element.h, element.fontSize);
  const width = element.w || height / 3;
  return {
    background: "none",
    border: "none",
    color: element.fill,
    font: `${element.fontSize}px ${element.fontFamily}`,
    padding: 0,
    margin: 0,
    display: "inline-block",
    lineHeight: 1,
    resize: "none",
    transform: `rotate(${(element.rotate * 180) / Math.PI}deg)`,
    overflow: "hidden",
    width: element.w || height / 3,
    height,
  } as React.CSSProperties;
}

/* returns the size of a text string using the style of the element passed */
export function getTextDimensionsForElement(
  text: string,
  element: TextElement,
) {
  const ctx = utilCanvas.getContext("2d")!;
  const lines = text.split("\n");

  const h = lines.length * element.fontSize;
  let w = 0;

  ctx.save();
  ctx.font = `${element.fontSize}px ${element.fontFamily}`;
  for (let i = 0; i < lines.length; i += 1) {
    const { width } = ctx.measureText(lines[i]);
    w = Math.max(w, width);
  }
  ctx.restore();

  return { w, h };
}

export function normalizeElement<T extends Mutable<CanvasElement>>(elem: T): T {
  elem.x = +elem.x.toFixed(ELEMENT_PRECISION);
  elem.y = +elem.y.toFixed(ELEMENT_PRECISION);
  elem.w = +elem.w.toFixed(ELEMENT_PRECISION);
  elem.h = +elem.h.toFixed(ELEMENT_PRECISION);

  if (elem.type === "text") {
    elem.text = elem.text.replaceAll(/\r\n?/g, "\n");
  }

  return elem;
}

/** checks if element should be discarded (i.e too small, etc)  */
export function isElementNegligible(
  element: CanvasElement,
  { grid }: AppState,
) {
  switch (element.type) {
    case "freedraw":
      return element.path.length < 2;

    case "shape":
      // shape is smaller than one grid pixel
      return element.w < grid.size && element.h < grid.size;

    default:
      return false;
  }
}

export function createTransformingElements(elements: CanvasElement[]) {
  return elements.map((elem) => ({
    element: elem,
    initialElement: deepClone(elem),
  })) as TransformingElement[];
}
