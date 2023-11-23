/**
 * Transformation algorithms were adapted from Excalidraw.
 * See: https://github.com/excalidraw/excalidraw/tree/master
 */

import {
  ELEMENT_PRECISION,
  ROTATION_SNAP_THRESHOLD,
  SELECTION_PADDING,
  SELECTION_ROTATE_HANDLE_OFFSET,
} from "@constants";
import {
  BoundingBox,
  Point,
  TransformHandle,
  TransformHandleData,
  TransformingElement,
  XYCoords,
} from "@core/types";

type TransformAnchor = Point;

const radiansToDegrees = (rad: number) => rad * (180 / Math.PI);
const degreesToRadians = (deg: number) => deg * (Math.PI / 180);
const normalizeDegrees = (deg: number) => {
  const value = +(deg % 360).toFixed(ELEMENT_PRECISION);
  return value < 0 ? 360 + value : value;
};

function rotatePointAroundAnchor(point: Point, anchor: Point, angle: number) {
  const [x1, y1] = point;
  const [x2, y2] = anchor;
  return {
    x: Math.cos(angle) * (x1 - x2) - Math.sin(angle) * (y1 - y2) + x2,
    y: Math.sin(angle) * (x1 - x2) + Math.cos(angle) * (y1 - y2) + y2,
  };
}

export function getTransformHandles(box: BoundingBox, scale: number) {
  const padding = SELECTION_PADDING / scale;
  const x1 = box.x - padding;
  const x2 = box.x + box.w + padding;
  const y1 = box.y - padding;
  const y2 = box.y + box.h + padding;
  const w = box.w + padding * 2;
  const rotateOffset = SELECTION_ROTATE_HANDLE_OFFSET / scale;
  const handles: TransformHandleData[] = [
    { x: x1, y: y1, type: "nw" },
    { x: x2, y: y1, type: "ne" },
    { x: x1, y: y2, type: "sw" },
    { x: x2, y: y2, type: "se" },
    { x: x1 + w / 2, y: y1 - rotateOffset, type: "rotate" },
  ];

  return handles;
}

export function getTransformHandleAnchor(
  handle: TransformHandle,
  selectionBox: BoundingBox,
): Point {
  const { x, y, w, h } = selectionBox;
  const anchors: Record<TransformHandle, [number, number]> = {
    se: [x, y],
    sw: [x + w, y],
    ne: [x, y + h],
    nw: [x + w, y + h],
    rotate: [x + w / 2, y + h / 2],
  };
  return anchors[handle];
}

export function getResizeScale(
  handle: TransformHandle,
  pointerOffset: XYCoords,
  selectionBox: BoundingBox,
): Point {
  // -1 means the axis is being dragged. (e.g `nw` is on both x and y axes,
  // hence direction is -1)
  const directionX = handle === "nw" || handle === "sw" ? -1 : 1;
  const directionY = handle === "nw" || handle === "ne" ? -1 : 1;

  const scaleX = 1 + (pointerOffset.x * directionX) / selectionBox.w;
  const scaleY = 1 + (pointerOffset.y * directionY) / selectionBox.h;
  return [scaleX, scaleY];
}

export function getRotateAngle({ x, y }: XYCoords, [x2, y2]: TransformAnchor) {
  const threshold = ROTATION_SNAP_THRESHOLD;
  let angle = Math.atan2(y - y2, x - x2) + Math.PI / 2;
  angle = Math.round(angle / threshold) * threshold;
  return angle;
}

export function getResizeMutations(
  elementBox: BoundingBox,
  [scaleX, scaleY]: Point,
  [anchorX, anchorY]: Point,
) {
  const didFlipX = elementBox.w * scaleX <= 0;
  const didFlipY = elementBox.h * scaleY <= 0;
  const flipX = didFlipX ? -1 : 1;
  const flipY = didFlipY ? -1 : 1;
  const absScaleX = Math.abs(scaleX);
  const absScaleY = Math.abs(scaleY);

  const w = elementBox.w * absScaleX;
  const h = elementBox.h * absScaleY;
  const shiftX = didFlipX ? w : 0;
  const shiftY = didFlipY ? h : 0;
  const offsetX = elementBox.x - anchorX;
  const offsetY = elementBox.y - anchorY;
  /** offset should be elemX - oppositeSideofBoundingBox */
  const x = anchorX + flipX * (absScaleX * offsetX + shiftX);
  const y = anchorY + flipY * (absScaleY * offsetY + shiftY);

  return { x, y, w, h };
}

export function getRotateMutations(
  { element, initialBox }: TransformingElement,
  selectionBoxCenter: TransformAnchor,
  draggedRadianAngle: number,
) {
  const elementAngle = draggedRadianAngle + degreesToRadians(initialBox.rotate);
  /** center of element */
  const center: Point = [element.x + element.w / 2, element.y + element.h / 2];
  /** rotate the element using its center as an anchor and return the offset */
  const offset = rotatePointAroundAnchor(
    center,
    selectionBoxCenter,
    elementAngle - degreesToRadians(element.rotate),
  );

  return {
    x: element.x + offset.x - center[0],
    y: element.y + offset.y - center[1],
    rotate: normalizeDegrees(radiansToDegrees(elementAngle)),
  };
}
