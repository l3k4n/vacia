/**
 * Transformation algorithms were adapted from Excalidraw.
 * See: https://github.com/excalidraw/excalidraw/tree/master
 */

import {
  TransformHandle,
  TransformHandleObject,
  TransformingElement,
} from "./types";
import { SELECTION_ROTATE_HANDLE_OFFSET } from "@constants";
import { Point, RotatedBoundingBox, XYCoords } from "@core/types";
import { rotatePoint } from "@core/utils";

interface ElementMutations {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rotate?: number;
  flippedX?: boolean;
  flippedY?: boolean;
}

export function getRotateAngle(
  { box, handle }: TransformHandleObject,
  pointer: XYCoords,
) {
  const normalizedPointer = rotatePoint(
    pointer.x,
    pointer.y,
    box.x + box.w / 2,
    box.y + box.h / 2,
    -box.rotate,
  );

  let angle = Math.atan2(
    normalizedPointer.y - handle.anchorY,
    normalizedPointer.x - handle.anchorX,
  );
  // add 2pi (1 full rotation) to prevent negative values
  // add pi/2 (90 deg) to make the top the starting point (see "unit-circle")
  angle += 2 * Math.PI + Math.PI / 2;
  // wrap around 2PI
  angle %= 2 * Math.PI;

  return angle;
}

export function getResizeScale(
  { box, handle }: TransformHandleObject,
  pointer: XYCoords,
): Point {
  const { x, y, w, h, rotate } = box;
  const { type } = handle;
  const normalizedPointer = rotatePoint(
    pointer.x,
    pointer.y,
    x + w / 2,
    y + h / 2,
    -rotate,
  );

  let scaleX = Math.abs(normalizedPointer.x - handle.anchorX) / w || 0;
  let scaleY = Math.abs(normalizedPointer.y - handle.anchorY) / h || 0;

  const yAxisFlipped =
    (type.startsWith("n") && normalizedPointer.y > handle.anchorY) ||
    (type.startsWith("s") && normalizedPointer.y < handle.anchorY);
  const xAxisFlipped =
    (type.endsWith("e") && normalizedPointer.x < handle.anchorX) ||
    (type.endsWith("w") && normalizedPointer.x > handle.anchorX);

  if (yAxisFlipped) scaleY *= -1;
  if (xAxisFlipped) scaleX *= -1;

  return [scaleX, scaleY];
}

function getSingleElementResizeMutations(
  { initialElement }: TransformingElement,
  [scaleX, scaleY]: Point,
  { anchorX, anchorY }: TransformHandle,
): ElementMutations {
  const absScaleX = Math.abs(scaleX);
  const absScaleY = Math.abs(scaleY);

  const w = initialElement.w * absScaleX;
  const h = initialElement.h * absScaleY;
  const flipX = scaleX < 0 ? -1 : 1;
  const flipY = scaleY < 0 ? -1 : 1;
  const shiftX = scaleX < 0 ? w : 0;
  const shiftY = scaleY < 0 ? h : 0;
  const offsetX = initialElement.x - anchorX;
  const offsetY = initialElement.y - anchorY;

  const x = anchorX + flipX * (absScaleX * offsetX + shiftX);
  const y = anchorY + flipY * (absScaleY * offsetY + shiftY);

  const { rotate } = initialElement;
  const prevCx = initialElement.x + initialElement.w / 2;
  const prevCy = initialElement.y + initialElement.h / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const rotatedPosition = rotatePoint(x, y, prevCx, prevCy, rotate);
  const rotatedCenter = rotatePoint(cx, cy, prevCx, prevCy, rotate);
  const normalizedCoords = rotatePoint(
    rotatedPosition.x,
    rotatedPosition.y,
    rotatedCenter.x,
    rotatedCenter.y,
    -rotate,
  );
  const flippedX = (flipX === -1) !== initialElement.flippedX;
  const flippedY = (flipY === -1) !== initialElement.flippedY;

  return {
    x: normalizedCoords.x,
    y: normalizedCoords.y,
    w,
    h,
    flippedX,
    flippedY,
  };
}

function getMultipleElementResizeMutations(
  { initialElement }: TransformingElement,
  [scaleX, scaleY]: Point,
  { anchorX, anchorY }: TransformHandle,
): ElementMutations {
  const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY));

  const w = initialElement.w * scale;
  const h = initialElement.h * scale;
  const flipX = scaleX < 0 ? -1 : 1;
  const flipY = scaleY < 0 ? -1 : 1;
  const shiftX = scaleX < 0 ? w : 0;
  const shiftY = scaleY < 0 ? h : 0;
  const offsetX = initialElement.x - anchorX;
  const offsetY = initialElement.y - anchorY;

  const x = anchorX + flipX * (scale * offsetX + shiftX);
  const y = anchorY + flipY * (scale * offsetY + shiftY);

  const flippedX = (flipX === -1) !== initialElement.flippedX;
  const flippedY = (flipY === -1) !== initialElement.flippedY;

  return { x, y, w, h, flippedX, flippedY };
}

export function resizeElement(
  element: TransformingElement,
  hit: TransformHandleObject,
  scale: Point,
): ElementMutations {
  const multipleElements = hit.elements.length > 1;
  if (multipleElements) {
    return getMultipleElementResizeMutations(element, scale, hit.handle);
  }
  return getSingleElementResizeMutations(element, scale, hit.handle);
}

export function rotateElement(
  { element, initialElement }: TransformingElement,
  hit: TransformHandleObject,
  angle: number,
): ElementMutations {
  const { anchorX, anchorY } = hit.handle;
  const elementAngle = angle + initialElement.rotate;
  const cx = element.x + element.w / 2;
  const cy = element.y + element.h / 2;
  /** rotate the element using its center as an anchor and return the offset */
  const offset = rotatePoint(
    cx,
    cy,
    anchorX,
    anchorY,
    elementAngle - element.rotate,
  );

  return {
    x: element.x + offset.x - cx,
    y: element.y + offset.y - cy,
    rotate: elementAngle % (2 * Math.PI),
  };
}

export function getTransformHandles(box: RotatedBoundingBox, scale: number) {
  const x1 = box.x;
  const x2 = box.x + box.w;
  const y1 = box.y;
  const y2 = box.y + box.h;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  const rotateHandleOffset = SELECTION_ROTATE_HANDLE_OFFSET / scale;
  const rotateYAnchor = y1 - rotateHandleOffset;

  const handles: TransformHandle[] = [
    { type: "nw", x: x1, y: y1, anchorX: x2, anchorY: y2 },
    { type: "ne", x: x2, y: y1, anchorX: x1, anchorY: y2 },
    { type: "sw", x: x1, y: y2, anchorX: x2, anchorY: y1 },
    { type: "se", x: x2, y: y2, anchorX: x1, anchorY: y1 },
    { type: "rotate", x: cx, y: rotateYAnchor, anchorX: cx, anchorY: cy },
  ];

  if (box.rotate) {
    handles.forEach((handle) => {
      Object.assign(
        handle,
        rotatePoint(
          handle.x,
          handle.y,
          (x1 + x2) / 2,
          (y1 + y2) / 2,
          box.rotate,
        ),
      );
    });
  }

  return handles;
}
