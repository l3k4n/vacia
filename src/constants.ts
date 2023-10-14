import { ElementStyles, ElementTransforms } from "@core/types";

export const GRID_COLOR = "#2c2c2c";

export const ZOOM_STEP = 0.1; // px
export const MAX_ZOOM = 50; // px
export const MIN_ZOOM = 0.1; // px

export const DEFAULT_ELEMENT_TRANSFORMS: ElementTransforms = {
  flippedX: false,
  flippedY: false,
};
export const DEFAULT_ELEMENT_STYLES: ElementStyles = {
  fill: "#ffffffff",
};

/** The max number of decimal places an element's position values should have.
 * Position values include x, y, width, height and the in a path[] */
export const ELEMENT_PRECISION = 2; // d.p (decimal places)

export const SELECTION_BOX_PADDING = 3; // px
