import { SELECTION_HANDLE_SIZE } from "@constants";
import {
  CanvasElement,
  BoundingBox,
  XYCoords,
  TransformHandleData,
  AppState,
  RotatedBoundingBox,
} from "@core/types";
import { rotatePointAroundAnchor } from "@core/utils";

function hitTestRect(box: BoundingBox, coords: XYCoords) {
  const { x, y, w, h } = box;
  const isInHorizontalBounds = coords.x >= x && coords.x <= x + w;
  const isInVerticalBounds = coords.y >= y && coords.y <= y + h;
  return isInHorizontalBounds && isInVerticalBounds;
}

function hitTestEllipse(box: BoundingBox, coords: XYCoords) {
  const { x, y, w, h } = box;

  const rX = w / 2;
  const rY = h / 2;
  const cX = x + w / 2;
  const cY = y + h / 2;

  /**
   * Equation of a circle
   * www.geeksforgeeks.org/check-if-a-point-is-inside-outside-or-on-the-ellipse/
   */
  const value = (coords.x - cX) ** 2 / rX ** 2 + (coords.y - cY) ** 2 / rY ** 2;

  // If value <= 1, coords is in the ellipse.
  return value <= 1;
}

/** Returns true if element is completely contained within the bounding box */
export function hitTestElementAgainstUnrotatedBox(
  element: CanvasElement,
  box: BoundingBox,
): boolean {
  const horizontalBoundsFitsBox =
    element.x >= box.x && element.x + element.w <= box.x + box.w;
  const verticalBoundsFitsBox =
    element.y >= box.y && element.y + element.h <= box.y + box.h;

  return horizontalBoundsFitsBox && verticalBoundsFitsBox;
}

/** Returns true if a coords is inside the specified element */
export function hitTestCoordsAgainstElement(
  element: CanvasElement,
  coords: XYCoords,
): boolean {
  const rotatedCoords = rotatePointAroundAnchor(
    coords.x,
    coords.y,
    element.x + element.w / 2,
    element.y + element.h / 2,
    -element.rotate,
  );

  switch (element.type) {
    case "shape":
      if (element.shape === "rect") return hitTestRect(element, rotatedCoords);
      return hitTestEllipse(element, rotatedCoords);

    case "freedraw":
      return hitTestRect(element, rotatedCoords);

    default:
      return false;
  }
}

/** Returns true if coords is within bounding box while ignoring rotation */
export function hitTestCoordsAgainstUnrotatedBox(
  coords: XYCoords,
  box: RotatedBoundingBox,
) {
  const rotatedCoords = rotatePointAroundAnchor(
    coords.x,
    coords.y,
    box.x + box.w / 2,
    box.y + box.h / 2,
    -box.rotate,
  );
  return hitTestRect(box, rotatedCoords);
}

/** returns type of transform handle at coords */
export function hitTestCoordsAgainstTransformHandles(
  handles: TransformHandleData[],
  coords: XYCoords,
  { zoom: scale }: AppState,
) {
  let hitHandle = null;
  /** Error margin around handle that will be forgiven */
  const hitThreshold = SELECTION_HANDLE_SIZE / scale;

  for (let i = 0; i < handles.length; i += 1) {
    const handle = handles[i];
    const handleBox = {
      x: handle.x - hitThreshold / 2,
      y: handle.y - hitThreshold / 2,
      w: hitThreshold,
      h: hitThreshold,
    };
    if (hitTestRect(handleBox, coords)) {
      hitHandle = handle.type;
      break;
    }
  }
  return hitHandle;
}
