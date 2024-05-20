import { EllipseHandler } from "./ellipse";
import { FreedrawHandler } from "./freedraw";
import { RectHandler } from "./rect";
import { TextHandler } from "./text";
import { CanvasElement } from "./types";
import { DEFAULT_ELEMENT_FILL } from "@constants";
import { BoundingBox } from "@core/types";

export function createPartialElement(box: BoundingBox): CanvasElement {
  return {
    ...box,
    type: "",
    fill: DEFAULT_ELEMENT_FILL,
    rotate: 0,
    flippedX: false,
    flippedY: false,
    locked: false,
    deleted: false,
  }
}

export { TextHandler, FreedrawHandler, EllipseHandler, RectHandler };
