import { ShapeElement, FreedrawElement } from "@core/types";

const generalElementProperties = { x: 0, y: 0, w: 10, h: 10, transforms: {} };

export function createShapeElement(
  shape: ShapeElement["shape"],
  props: Partial<ShapeElement> = {},
): ShapeElement {
  return { ...generalElementProperties, ...props, type: "shape", shape };
}

export function createFreedrawElement(
  props: Partial<FreedrawElement> = {},
): FreedrawElement {
  return { ...generalElementProperties, path: [], ...props, type: "freedraw" };
}
