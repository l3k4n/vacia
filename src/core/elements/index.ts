import { DEFAULT_ELEMENT_STYLES, DEFAULT_ELEMENT_TRANSFORMS } from "@constants";
import {
  CanvasElement,
  ElementStyles,
  ElementTransforms,
  FreedrawElement,
  ShapeElement,
} from "@core/types";

type StripElement<T extends CanvasElement> = Omit<
  T,
  "type" | "transforms" | "styles"
> & {
  styles?: Partial<ElementStyles>;
  transforms?: Partial<ElementTransforms>;
};

type ShapeOptions = StripElement<ShapeElement>;
function createShapeElement(options: ShapeOptions): ShapeElement {
  return {
    ...options,
    styles: { ...DEFAULT_ELEMENT_STYLES, ...options.styles },
    transforms: { ...DEFAULT_ELEMENT_TRANSFORMS, ...options.transforms },
    type: "shape",
  };
}

type FreedrawOptions = StripElement<FreedrawElement>;
function createFreedrawElement(options: FreedrawOptions): FreedrawElement {
  return {
    ...options,
    styles: { ...DEFAULT_ELEMENT_STYLES, ...options.styles },
    transforms: { ...DEFAULT_ELEMENT_TRANSFORMS, ...options.transforms },
    type: "freedraw",
  };
}

export { createShapeElement, createFreedrawElement };
