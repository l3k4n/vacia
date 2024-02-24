/**
 * Transformation algorithms were adapted from Excalidraw.
 * See: https://github.com/excalidraw/excalidraw/tree/master
 */

import { SELECTION_ROTATE_HANDLE_OFFSET } from "@constants";
import {
  CanvasElementMutations,
  Point,
  RotatedBoundingBox,
  TransformHandle,
  TransformingElement,
  XYCoords,
} from "@core/types";
import { getRotatedBoxCoords, rotatePointAroundAnchor } from "@core/utils";

/* gets the surrounding box of 'initialElement' in a single iteration */
function getInitialElementSurroundingBox(elements: TransformingElement[]) {
  if (elements.length < 1) return { x: 0, y: 0, w: 0, h: 0, rotate: 0 };
  if (elements.length === 1) {
    // if there is a single box return its bounds
    const { x, y, w, h, rotate } = elements[0].initialElement;
    return { x, y, w, h, rotate };
  }
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;

  for (let i = 0; i < elements.length; i += 1) {
    const [nw, ne, sw, se] = getRotatedBoxCoords(elements[i].initialElement);

    x1 = Math.min(x1, nw.x, ne.x, se.x, sw.x);
    y1 = Math.min(y1, nw.y, ne.y, se.y, sw.y);
    x2 = Math.max(x2, nw.x, ne.x, se.x, sw.x);
    y2 = Math.max(y2, nw.y, ne.y, se.y, sw.y);
  }

  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, rotate: 0 };
}

export function getRotateAngle(
  elements: TransformingElement[],
  pointerCoords: XYCoords,
  handle: TransformHandle,
) {
  const initialSelectionBox = getInitialElementSurroundingBox(elements);
  const normalizedPointer = rotatePointAroundAnchor(
    pointerCoords.x,
    pointerCoords.y,
    initialSelectionBox.x + initialSelectionBox.w / 2,
    initialSelectionBox.y + initialSelectionBox.h / 2,
    -initialSelectionBox.rotate,
  );

  let angle = Math.atan2(
    normalizedPointer.y - handle.anchorY,
    normalizedPointer.x - handle.anchorX,
  );
  // add 2pi (1 full rotation) to prevent negative values
  // add pi/2 (90 deg) to make the top the starting point (see "unit-circle")
  angle += 2 * Math.PI + Math.PI / 2;

  return angle;
}

export function getResizeScale(
  elements: TransformingElement[],
  pointer: XYCoords,
  handle: TransformHandle,
): Point {
  const { x, y, w, h, rotate } = getInitialElementSurroundingBox(elements);
  const { type } = handle;
  const normalizedPointer = rotatePointAroundAnchor(
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

export function rescalePath(
  path: Point[],
  scaleX: number,
  scaleY: number,
  shiftX: number,
  shiftY: number,
) {
  if (scaleX === 1 && scaleY === 1) return path;

  const scaledPath: Point[] = [];
  for (let i = 0; i < path.length; i += 1) {
    const [x, y] = path[i];
    scaledPath.push([x * scaleX + shiftX, y * scaleY + shiftY]);
  }

  return scaledPath;
}

function getSingleElementResizeMutations(
  { initialElement }: TransformingElement,
  [scaleX, scaleY]: Point,
  { anchorX, anchorY }: TransformHandle,
): CanvasElementMutations {
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

  const rotatedPosition = rotatePointAroundAnchor(x, y, prevCx, prevCy, rotate);
  const rotatedCenter = rotatePointAroundAnchor(cx, cy, prevCx, prevCy, rotate);
  const normalizedCoords = rotatePointAroundAnchor(
    rotatedPosition.x,
    rotatedPosition.y,
    rotatedCenter.x,
    rotatedCenter.y,
    -rotate,
  );

  let path: Point[] | undefined;
  if (initialElement.type === "freedraw") {
    path = rescalePath(
      initialElement.path,
      absScaleX * flipX,
      absScaleY * flipY,
      shiftX,
      shiftY,
    );
  }

  return { x: normalizedCoords.x, y: normalizedCoords.y, w, h, path };
}

function getMultipleElementResizeMutations(
  { initialElement }: TransformingElement,
  [scaleX, scaleY]: Point,
  { anchorX, anchorY }: TransformHandle,
): CanvasElementMutations {
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

  let path: Point[] | undefined;
  if (initialElement.type === "freedraw") {
    path = rescalePath(
      initialElement.path,
      scale * flipX,
      scale * flipY,
      shiftX,
      shiftY,
    );
  }

  return { x, y, w, h, path };
}

export function getResizeMutations(
  element: TransformingElement,
  scale: Point,
  anchor: TransformHandle,
  multipleElements: boolean,
): CanvasElementMutations {
  if (multipleElements) {
    return getMultipleElementResizeMutations(element, scale, anchor);
  }
  return getSingleElementResizeMutations(element, scale, anchor);
}

export function getRotateMutations(
  { element, initialElement }: TransformingElement,
  angle: number,
  { anchorX, anchorY }: TransformHandle,
): CanvasElementMutations {
  const elementAngle = angle + initialElement.rotate;
  const cx = element.x + element.w / 2;
  const cy = element.y + element.h / 2;
  /** rotate the element using its center as an anchor and return the offset */
  const offset = rotatePointAroundAnchor(
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
        rotatePointAroundAnchor(
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
