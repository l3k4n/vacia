import { CanvasElement, FreedrawElement, ShapeElement } from "@core/types";

type StripElement<T extends CanvasElement> = Omit<T, "type" | "transforms">;

type ShapeOptions = StripElement<ShapeElement>;
function createShapeElement(options: ShapeOptions): ShapeElement {
  return {
    type: "shape",
    transforms: {},
    ...options,
  };
}

type FreedrawOptions = StripElement<FreedrawElement>;
function createFreedrawElement(options: FreedrawOptions): FreedrawElement {
  return {
    type: "freedraw",
    transforms: {},
    ...options,
  };
}

export { createShapeElement, createFreedrawElement };
