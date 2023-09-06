import { AppState, XYCoords, Dimensions } from "./types";

/** returns the center position of in screen coords */
export function getScreenCenterCoords(state: AppState): XYCoords {
  return {
    x: state.width / 2,
    y: state.height / 2,
  };
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Inverts a the width or height of a bounding box if they are negative and
 * returns which axes were inverted. (Note: Visually, position of bounding
 * box will not change) */
export function invertNegativeDimensions(dimensions: Dimensions): {
  dimensions: Dimensions;
  didFlipX: boolean;
  didFlipY: boolean;
} {
  let { x, y, w, h } = dimensions;
  let didFlipX = false;
  let didFlipY = false;

  if (dimensions.w < 0) {
    w *= -1;
    x -= w;
    didFlipX = true;
  }
  if (dimensions.h < 0) {
    h *= -1;
    y -= h;
    didFlipY = true;
  }

  return { didFlipX, didFlipY, dimensions: { x, y, w, h } };
}
