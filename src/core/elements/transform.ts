/**
 * Transformation algorithms were adapted from Excalidraw.
 * See: https://github.com/excalidraw/excalidraw/tree/master
 */

import {
  ROTATION_SNAP_THRESHOLD,
  SELECTION_PADDING,
  SELECTION_ROTATE_HANDLE_OFFSET,
} from "@constants";
import {
  CanvasElementMutations,
  Point,
  RotatedBoundingBox,
  TransformHandle,
  TransformHandleData,
  TransformingElement,
  XYCoords,
} from "@core/types";
import { rotatePointAroundAnchor } from "@core/utils";

type TransformAnchor = Point;
interface TransformData {
  angle: number;
  anchor: TransformAnchor;
  scale: Point;
  handle: TransformHandle;
  transformingMultipleElements: boolean;
}

function getTransformHandleAnchor(
  handle: TransformHandle,
  initialSelectionBox: RotatedBoundingBox,
): TransformAnchor {
  const { x, y, w, h } = initialSelectionBox;
  const anchors: Record<TransformHandle, TransformAnchor> = {
    se: [x, y],
    sw: [x + w, y],
    ne: [x, y + h],
    nw: [x + w, y + h],
    rotate: [x + w / 2, y + h / 2],
  };
  return anchors[handle];
}

function getResizeScale(
  pointer: XYCoords,
  [anchorX, anchorY]: TransformAnchor,
  initialSelectionBox: RotatedBoundingBox,
  handle: TransformHandle,
): Point {
  const flipConditions = {
    ne: [pointer.x < anchorX, pointer.y > anchorY],
    se: [pointer.x < anchorX, pointer.y < anchorY],
    sw: [pointer.x > anchorX, pointer.y < anchorY],
    nw: [pointer.x > anchorX, pointer.y > anchorY],
    rotate: [false, false], // axis can not flip while rotating
  };
  const flipX = flipConditions[handle][0] ? -1 : 1;
  const flipY = flipConditions[handle][1] ? -1 : 1;

  return [
    (Math.abs(pointer.x - anchorX) * flipX) / initialSelectionBox.w || 0,
    (Math.abs(pointer.y - anchorY) * flipY) / initialSelectionBox.h || 0,
  ];
}

function getRotateAngle(
  pointer: XYCoords,
  [anchorX, anchorY]: TransformAnchor,
) {
  const threshold = ROTATION_SNAP_THRESHOLD;
  const angle =
    Math.atan2(pointer.y - anchorY, pointer.x - anchorX) + (5 * Math.PI) / 2;

  return Math.round(angle / threshold) * threshold;
}

function getResizeMutations(
  { initialBox }: TransformingElement,
  transformData: TransformData,
): CanvasElementMutations {
  const [anchorX, anchorY] = transformData.anchor;
  const [scaleX, scaleY] = transformData.scale;
  const scale = Math.max(Math.abs(scaleX), Math.abs(scaleY));

  const w = initialBox.w * scale;
  const h = initialBox.h * scale;
  const flipX = scaleX < 0 ? -1 : 1;
  const flipY = scaleY < 0 ? -1 : 1;
  const shiftX = scaleX < 0 ? w : 0;
  const shiftY = scaleY < 0 ? h : 0;
  const offsetX = initialBox.x - anchorX;
  const offsetY = initialBox.y - anchorY;

  const x = anchorX + flipX * (scale * offsetX + shiftX);
  const y = anchorY + flipY * (scale * offsetY + shiftY);

  return { x, y, w, h };
}

function getSingleSelectionResizeMutations(
  { initialBox }: TransformingElement,
  transformData: TransformData,
): CanvasElementMutations {
  const [scaleX, scaleY] = transformData.scale;
  const newWidth = initialBox.w * scaleX;
  const newHeight = initialBox.h * scaleY;

  // x or y may be NaN if size is 0
  if (newWidth && newHeight) {
    const initialElementCoords = {
      x1: initialBox.x,
      y1: initialBox.y,
      x2: initialBox.x + initialBox.w,
      y2: initialBox.y + initialBox.h,
      cx: initialBox.x + initialBox.w / 2,
      cy: initialBox.y + initialBox.h / 2,
    };

    const position = { x: initialElementCoords.x1, y: initialElementCoords.y1 };
    switch (transformData.handle) {
      case "nw":
        position.x = initialElementCoords.x2 - Math.abs(newWidth);
        position.y = initialElementCoords.y2 - Math.abs(newHeight);
        break;
      case "ne":
        position.x = initialElementCoords.x1;
        position.y = initialElementCoords.y2 - Math.abs(newHeight);
        break;
      case "sw":
        position.x = initialElementCoords.x2 - Math.abs(newWidth);
        position.y = initialElementCoords.y1;
        break;
      default:
    }

    // amount to shift position by when axis flips
    const shiftX = Math.abs(Math.min(newWidth, 0));
    const shiftY = Math.abs(Math.min(newHeight, 0));

    position.x += shiftX * (transformData.handle.includes("e") ? -1 : 1);
    position.y += shiftY * (transformData.handle.includes("s") ? -1 : 1);

    const rotatedPosition = rotatePointAroundAnchor(
      position.x,
      position.y,
      initialElementCoords.cx,
      initialElementCoords.cy,
      initialBox.rotate,
    );
    const rotatedCenter = rotatePointAroundAnchor(
      position.x + Math.abs(newWidth) / 2,
      position.y + Math.abs(newHeight) / 2,
      initialElementCoords.cx,
      initialElementCoords.cy,
      initialBox.rotate,
    );
    const normalizedPosition = rotatePointAroundAnchor(
      rotatedPosition.x,
      rotatedPosition.y,
      rotatedCenter.x,
      rotatedCenter.y,
      -initialBox.rotate,
    );

    return {
      x: normalizedPosition.x,
      y: normalizedPosition.y,
      w: Math.abs(newWidth),
      h: Math.abs(newHeight),
    };
  }

  return {};
}

function getRotateMutations(
  { element, initialBox }: TransformingElement,
  transformData: TransformData,
): CanvasElementMutations {
  const elementAngle = transformData.angle + initialBox.rotate;
  const cx = element.x + element.w / 2;
  const cy = element.y + element.h / 2;
  /** rotate the element using its center as an anchor and return the offset */
  const offset = rotatePointAroundAnchor(
    cx,
    cy,
    transformData.anchor[0],
    transformData.anchor[1],
    elementAngle - element.rotate,
  );

  return {
    x: element.x + offset.x - cx,
    y: element.y + offset.y - cy,
    rotate: elementAngle,
  };
}

export function getTransformHandles(box: RotatedBoundingBox, scale: number) {
  const padding = SELECTION_PADDING / scale;
  const x1 = box.x - padding;
  const x2 = box.x + box.w + padding;
  const y1 = box.y - padding;
  const y2 = box.y + box.h + padding;
  const w = box.w + padding * 2;
  const rotateHandleOffset = SELECTION_ROTATE_HANDLE_OFFSET / scale;
  const handles: TransformHandleData[] = [
    { x: x1, y: y1, type: "nw" },
    { x: x2, y: y1, type: "ne" },
    { x: x1, y: y2, type: "sw" },
    { x: x2, y: y2, type: "se" },
    { x: x1 + w / 2, y: y1 - rotateHandleOffset, type: "rotate" },
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

export function getSelectionTransformData(
  pointerCoords: XYCoords,
  handle: TransformHandle,
  initialSelectionBox: RotatedBoundingBox,
  multipleElements: boolean,
): TransformData {
  const anchor = getTransformHandleAnchor(handle, initialSelectionBox);
  /** since transforms are calculated by reversing rotation to get a normal
   * bounding box, pointer also has to be rotated backwards to ensure it hits
   * the transform handle at its unrotated point. */
  const normalizedPointer = rotatePointAroundAnchor(
    pointerCoords.x,
    pointerCoords.y,
    initialSelectionBox.x + initialSelectionBox.w / 2,
    initialSelectionBox.y + initialSelectionBox.h / 2,
    -initialSelectionBox.rotate,
  );
  return {
    anchor,
    handle,
    transformingMultipleElements: multipleElements,
    angle: getRotateAngle(normalizedPointer, anchor),
    scale: getResizeScale(
      normalizedPointer,
      anchor,
      initialSelectionBox,
      handle,
    ),
  };
}

export function getTransformedElementMutations(
  element: TransformingElement,
  transformData: TransformData,
): CanvasElementMutations {
  if (transformData.handle === "rotate") {
    return getRotateMutations(element, transformData);
  }
  if (transformData.transformingMultipleElements) {
    return getResizeMutations(element, transformData);
  }

  return getSingleSelectionResizeMutations(element, transformData);
}