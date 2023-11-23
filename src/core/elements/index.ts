import { GENERIC_ELEMENT_PROPS } from "@constants";
import {
  BoundingBox,
  CanvasElement,
  FreedrawElement,
  ShapeElement,
} from "@core/types";

type StripElement<T extends CanvasElement, S extends keyof T> = Partial<
  Omit<T, "type">
> &
  BoundingBox &
  Pick<T, S>;

type ShapeOptions = StripElement<ShapeElement, "shape">;
function createShapeElement(options: ShapeOptions): ShapeElement {
  return {
    ...GENERIC_ELEMENT_PROPS,
    ...options,
    type: "shape",
  };
}

type FreedrawOptions = StripElement<FreedrawElement, "path">;
function createFreedrawElement(options: FreedrawOptions): FreedrawElement {
  return {
    ...GENERIC_ELEMENT_PROPS,
    ...options,
    type: "freedraw",
  };
}

export { createShapeElement, createFreedrawElement };
