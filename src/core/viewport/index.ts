/* eslint-disable max-len */
import { MAX_ZOOM, MIN_ZOOM } from "@constants";
import { AppState, XYCoords } from "@core/types";
import { clampNumber } from "@core/utils";

/** returns the center position of in screen coords */
export function getScreenCenterCoords(state: AppState): XYCoords {
  return {
    x: state.width / 2,
    y: state.height / 2,
  };
}

/** Takes a coordinate in the virtual plane and returns the coords of the
 * closest grid intersection */
export function snapVirtualCoordsToGrid(
  { x, y }: XYCoords,
  { grid }: AppState,
) {
  const { size } = grid;

  return { x: Math.round(x / size) * size, y: Math.round(y / size) * size };
}

/** Converts a screen position to its corresponding position relative to the
 * scroll offset. */
export function screenOffsetToVirtualOffset(
  { x, y }: XYCoords,
  { scrollOffset, zoom }: AppState,
) {
  return { x: (x - scrollOffset.x) / zoom, y: (y - scrollOffset.y) / zoom };
}

/** Calculates scrolloffset and zoom value around a specified anchor point,
 * ensuring that the anchor point remains visually in the same position. */
export function getNewZoomState(
  { value, anchor }: { value: number; anchor: XYCoords },
  state: AppState,
) {
  const currentZoom = state.zoom;
  const newZoom = clampNumber(value, MIN_ZOOM, MAX_ZOOM);

  const zoomMulitplier = newZoom / currentZoom;

  const scrollOffsetFromPointX = anchor.x - state.scrollOffset.x;
  const scrollOffsetFromPointY = anchor.y - state.scrollOffset.y;

  return {
    zoom: newZoom,
    scrollOffset: {
      x: anchor.x - scrollOffsetFromPointX * zoomMulitplier,
      y: anchor.y - scrollOffsetFromPointY * zoomMulitplier,
    },
  };
}
