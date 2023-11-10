import { SELECTION_PADDING } from "@constants";
import {
  BoundingBox,
  TransformHandle,
  TransformHandleData,
  XYCoords,
} from "@core/types";

/**
 * Transformation algorithms were adapted from Excalidraw.
 * See: https://github.com/excalidraw/excalidraw/tree/master
 */

interface TransformOptions {
  scale: [number, number];
  anchor: [number, number];
}

export function getTransformHandles(box: BoundingBox, scale: number) {
  const padding = SELECTION_PADDING / scale;
  const x1 = box.x - padding;
  const x2 = box.x + box.w + padding;
  const y1 = box.y - padding;
  const y2 = box.y + box.h + padding;
  const handles: TransformHandleData[] = [
    { x: x1, y: y1, type: "nw" },
    { x: x2, y: y1, type: "ne" },
    { x: x1, y: y2, type: "sw" },
    { x: x2, y: y2, type: "se" },
  ];

  return handles;
}

export function getHandleAnchor(
  handle: TransformHandle,
  selectionBox: BoundingBox,
): TransformOptions["anchor"] {
  const { x, y, w, h } = selectionBox;
  const anchors: Record<TransformHandle, [number, number]> = {
    se: [x, y],
    sw: [x + w, y],
    ne: [x, y + h],
    nw: [x + w, y + h],
  };
  return anchors[handle];
}

export function getTransformScale(
  handle: TransformHandle,
  pointer: XYCoords,
  selectionBox: BoundingBox,
): TransformOptions["scale"] {
  // -1 means the axis is being dragged. (e.g `nw` is on both x and y axes,
  // hence direction is -1)
  const directionX = handle === "nw" || handle === "sw" ? -1 : 1;
  const directionY = handle === "nw" || handle === "ne" ? -1 : 1;

  const scaleX = 1 + (pointer.x * directionX) / selectionBox.w;
  const scaleY = 1 + (pointer.y * directionY) / selectionBox.h;

  return [scaleX, scaleY];
}

export function getResizeTransforms(
  elementBox: BoundingBox,
  options: TransformOptions,
) {
  const [scaleX, scaleY] = options.scale;
  const [anchorX, anchorY] = options.anchor;

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
