/* eslint-disable no-use-before-define */

import { CanvasElement, TransformingElement } from "./elements/types";
import { AppState, BoundingBox, RotatedBoundingBox, XYCoords } from "./types";
import { MAX_ZOOM, MIN_ZOOM } from "@constants";

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** flips the sides of a box if it has negative width or height */
export function normalizeBox(box: BoundingBox): BoundingBox {
  const { x, y, w, h } = box;
  const shiftX = Math.min(0, w);
  const shiftY = Math.min(0, h);

  return { x: x + shiftX, y: y + shiftY, w: Math.abs(w), h: Math.abs(h) };
}

/** rotate [x1, y1] around [x2, y2] */
export function rotatePoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number,
): XYCoords {
  return {
    x: Math.cos(angle) * (x1 - x2) - Math.sin(angle) * (y1 - y2) + x2,
    y: Math.sin(angle) * (x1 - x2) + Math.cos(angle) * (y1 - y2) + y2,
  };
}

/** returns the absolute position of the vertices of the rotated box */
export function getRotatedBoxVertices(box: RotatedBoundingBox) {
  const x1 = box.x;
  const x2 = x1 + box.w;
  const y1 = box.y;
  const y2 = y1 + box.h;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  return {
    nw: rotatePoint(x1, y1, cx, cy, box.rotate),
    ne: rotatePoint(x2, y1, cx, cy, box.rotate),
    sw: rotatePoint(x1, y2, cx, cy, box.rotate),
    se: rotatePoint(x2, y2, cx, cy, box.rotate),
  };
}

/** returns a bounding box containing the rotated boxed passed to it */
export function getSurroundingBoundingBox(
  boxes: RotatedBoundingBox[],
): RotatedBoundingBox {
  if (boxes.length < 1) return { x: 0, y: 0, w: 0, h: 0, rotate: 0 };
  if (boxes.length === 1) {
    // if there is a single box return its bounds
    const { x, y, w, h, rotate } = boxes[0];
    return { x, y, w, h, rotate };
  }
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;

  for (let i = 0; i < boxes.length; i += 1) {
    const { nw, ne, sw, se } = getRotatedBoxVertices(boxes[i]);

    x1 = Math.min(x1, nw.x, ne.x, se.x, sw.x);
    y1 = Math.min(y1, nw.y, ne.y, se.y, sw.y);
    x2 = Math.max(x2, nw.x, ne.x, se.x, sw.x);
    y2 = Math.max(y2, nw.y, ne.y, se.y, sw.y);
  }

  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, rotate: 0 };
}

export function deepClone<T extends object>(obj: T | null): T | null {
  if (obj === null) return null;
  const clone = (Array.isArray(obj) ? [] : {}) as T;

  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i] as keyof T;

    if (Object.hasOwn(obj, key)) {
      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        clone[key] = deepClone(value as object) as T[keyof T];
      } else {
        clone[key] = value;
      }
    }
  }

  return clone;
}

/** bahaves like 'Object.assign' except 'undefined' keys will be ignored */
export function assignWithoutUndefined<T extends object, S extends object>(
  target: T,
  source: S,
) {
  const keys = Object.keys(source);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = source[key as keyof S];
    if (Object.hasOwn(source, key) && value !== undefined) {
      type kT = keyof T;
      // eslint-disable-next-line no-param-reassign
      target[key as kT] = value as T[kT];
    }
  }

  return target;
}

/** creates an object for each item in array which keeps its initial state */
export function createTransformElements(elements: CanvasElement[]) {
  return elements.map((elem) => ({
    element: elem,
    initialElement: deepClone(elem),
  })) as TransformingElement[];
}

/** returns the center position of in viewport coords */
export function getScreenCenterCoords(state: AppState): XYCoords {
  const bounds = getAppBounds(state);
  return { x: bounds.w / 2, y: bounds.h / 2 };
}

/** snaps the coordinates to the nearest grid point */
export function snapToGrid({ x, y }: XYCoords, grid: AppState["grid"]) {
  const { size } = grid;
  return { x: Math.round(x / size) * size, y: Math.round(y / size) * size };
}

/** Calculates scrolloffset and zoom value around a specified anchor point,
 * ensuring that the anchor point remains visually in the same position. */
export function getNewZoomState(
  value: number,
  anchor: XYCoords,
  { zoom, scrollOffset }: AppState,
) {
  const newZoom = clamp(value, MIN_ZOOM, MAX_ZOOM);

  const zoomMulitplier = newZoom / zoom;

  const scrollOffsetFromPointX = anchor.x - scrollOffset.x;
  const scrollOffsetFromPointY = anchor.y - scrollOffset.y;

  return {
    zoom: newZoom,
    scrollOffset: {
      x: anchor.x - scrollOffsetFromPointX * zoomMulitplier,
      y: anchor.y - scrollOffsetFromPointY * zoomMulitplier,
    },
  };
}

/** returns resizes the width and height to their new sizes and ensures their
 * aspect ratio remains the same */
export function resizeAspectRatio(
  w: number,
  h: number,
  newW: number,
  newH: number,
  /** if true, absolute width and height will be equal */
  equalRatio = false,
) {
  if (equalRatio) {
    const size = Math.max(Math.abs(newW), Math.abs(newH));
    return { w: size * Math.sign(newW), h: size * Math.sign(newH) };
  }

  const ratio = Math.max(Math.abs(newW / w), Math.abs(newH / h));
  return {
    w: w * ratio * Math.sign(newW),
    h: h * ratio * Math.sign(newH),
  };
}

/** makes `coords` relative to the canvas */
export function toViewportCoords(coords: XYCoords, state: AppState) {
  const { scrollOffset: offset, zoom } = state;
  return {
    x: (coords.x - offset.x) / zoom,
    y: (coords.y - offset.y) / zoom,
  };
}

/** makes `offset` relative to the canvas */
export function toViewportOffset(offset: number, state: AppState) {
  return offset / state.zoom;
}

/** makes `coords` relative to the screen */
export function toScreenCoords(coords: XYCoords, state: AppState) {
  const { scrollOffset: offset, zoom } = state;
  return {
    x: coords.x * zoom + offset.x,
    y: coords.y * zoom + offset.y,
  };
}

/** makes `offset` relative to the screen */
export function toScreenOffset(offset: number, state: AppState) {
  return offset * state.zoom;
}

/** returns a bounding box of the current viewable portion of the app */
export function getAppBounds(state: AppState): BoundingBox {
  return {
    x: -state.scrollOffset.x,
    y: -state.scrollOffset.y,
    w: toViewportOffset(window.innerWidth, state),
    h: toViewportOffset(window.innerHeight, state),
  };
}

/** returns XYCoords for a scroll offset that contains the bounding box */
export function getScrollOffsetContainingBox(
  box: BoundingBox,
  state: AppState,
): XYCoords {
  const bounds = getAppBounds(state);
  let { x, y } = state.scrollOffset;

  if (box.x + box.w > bounds.x + bounds.w) {
    x = (bounds.w - (box.x + box.w)) * state.zoom;
  } else if (box.x < bounds.x) {
    x = -Math.floor(box.x) * state.zoom;
  }

  if (box.y + box.h > bounds.y + bounds.h) {
    y = Math.ceil(bounds.h - (box.y + box.h));
  } else if (box.y < bounds.y) {
    y = -Math.floor(box.y);
  }

  return { x, y };
}
