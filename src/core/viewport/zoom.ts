import { MAX_ZOOM, MIN_ZOOM } from "@constants";
import { AppState, XYCoords } from "@core/types";
import { clampNumber } from "@core/utils";

interface ZoomOptions {
  value: number;
  anchor: XYCoords;
}

/** Calculates scrolloffset and zoom value around a specified anchor point,
 * ensuring that the anchor point remains visually in the same position. */
export function getNewZoomState(
  { value, anchor }: ZoomOptions,
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
