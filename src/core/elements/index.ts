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

const defaultStyles: ElementStyles = {
  fill: "#ffffffff",
};

const defaultTransforms: ElementTransforms = {
  flippedX: false,
  flippedY: false,
};

type ShapeOptions = StripElement<ShapeElement>;
function createShapeElement(options: ShapeOptions): ShapeElement {
  return {
    ...options,
    styles: { ...defaultStyles, ...options.styles },
    transforms: { ...defaultTransforms, ...options.transforms },
    type: "shape",
  };
}

type FreedrawOptions = StripElement<FreedrawElement>;
function createFreedrawElement(options: FreedrawOptions): FreedrawElement {
  return {
    ...options,
    styles: { ...defaultStyles, ...options.styles },
    transforms: { ...defaultTransforms, ...options.transforms },
    type: "freedraw",
  };
}

export { createShapeElement, createFreedrawElement };
