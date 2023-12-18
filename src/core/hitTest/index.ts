import { SELECTION_HANDLE_SIZE } from "@constants";
import {
  CanvasElement,
  BoundingBox,
  XYCoords,
  TransformHandleData,
  AppState,
  RotatedBoundingBox,
  Point,
} from "@core/types";
import {
  getRotatedBoxCoords,
  isPathClosed,
  rotatePointAroundAnchor,
} from "@core/utils";

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

function hitTestOpenPath(coords: XYCoords, path: Point[], threshold: number) {
  for (let i = 0; i < path.length - 1; i += 1) {
    const [startX, startY] = path[i];
    const [endX, endY]: [number, number] = path[i + 1];

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dy, dx);

    const projectionScale =
      ((coords.x - startX) * dx + (coords.y - startY) * dy) /
      (dx ** 2 + dy ** 2);

    /** a perpendicular point from the hit coords, along the line but, may or
     * may not be on the line */
    const projectedPoint: Point = [
      startX + projectionScale * dx,
      startY + projectionScale * dy,
    ];

    const distanceToStart: number = Math.hypot(
      startX - projectedPoint[0],
      startY - projectedPoint[1],
    );

    const distanceToEnd: number = Math.hypot(
      endX - projectedPoint[0],
      endY - projectedPoint[1],
    );

    /** closest point on the line to the hit coords */
    let closestPoint: [number, number];
    if (Math.max(distanceToStart, distanceToEnd) < length) {
      closestPoint = projectedPoint;
    } else if (distanceToEnd < distanceToStart) {
      closestPoint = [endX, endY];
    } else {
      closestPoint = [startX, startY];
    }

    const distanceToClosestPoint = Math.hypot(
      coords.y - closestPoint[1],
      coords.x - closestPoint[0],
    );

    if (distanceToClosestPoint < threshold) return true;
  }

  return false;
}

function hitTestClosedPath(point: XYCoords, vs: Point[]) {
  // https://stackoverflow.com/a/29915728
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
  const { x, y } = point;

  let isProjectionInPolygon = false;
  for (let i = 0; i < vs.length; i += 1) {
    const [startX, startY] = vs[i];
    const [endX, endY] = vs[(i + 1) % vs.length];

    const withinXAxis =
      x < ((endX - startX) * (y - startY)) / (endY - startY) + startX;
    const withinYAxis = startY < y !== endY < y;
    const intersect = withinXAxis && withinYAxis;

    if (intersect) isProjectionInPolygon = !isProjectionInPolygon;
  }

  return isProjectionInPolygon;
}

/** Returns true if element is completely contained within the bounding box */
export function hitTestElementAgainstUnrotatedBox(
  element: CanvasElement,
  box: BoundingBox,
): boolean {
  const elementCoords = getRotatedBoxCoords(element);

  for (let i = 0; i < elementCoords.length; i += 1) {
    if (!hitTestRect(box, elementCoords[i])) return false;
  }
  return true;
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

    case "freedraw": {
      const { x, y, w, h, path } = element;
      const threshold = 10;
      const relativeCoords = { x: rotatedCoords.x - x, y: rotatedCoords.y - y };
      const boxWithAllowance = {
        // apply threshold to boundingbox
        x: x - threshold,
        y: y - threshold,
        w: w + threshold * 2,
        h: h + threshold * 2,
      };
      // hit testing path is expensive, so check the boundingbox first
      if (!hitTestRect(boxWithAllowance, rotatedCoords)) return false;
      if (isPathClosed(path)) return hitTestClosedPath(relativeCoords, path);
      return hitTestOpenPath(relativeCoords, path, threshold);
    }

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
