import { AppState, XYCoords, Dimensions } from "./types";

export function getVisibleCenterCoords(state: AppState): XYCoords {
  return {
    x: state.width / 2,
    y: state.height / 2,
  };
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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
