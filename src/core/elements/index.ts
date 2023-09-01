import { CanvasElement, FreedrawElement, ShapeElement } from "@core/types";

type StripElement<T extends CanvasElement> = Omit<T, "type">;

type ShapeOptions = StripElement<ShapeElement>;
function createShapeElement(options: ShapeOptions): ShapeElement {
  return {
    type: "shape",
    ...options,
  };
}

type FreedrawOptions = StripElement<FreedrawElement>;
function createFreedrawElement(options: FreedrawOptions): FreedrawElement {
  return {
    type: "freedraw",
    ...options,
  };
}

export { createShapeElement, createFreedrawElement };
