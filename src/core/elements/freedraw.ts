import { ElementHandler } from "./handler";
import { FreedrawElement } from "./types";
import {
  ELEMENT_PRECISION,
  GENERIC_ELEMENT_PROPS,
  PATH_JOIN_THRESHOLD,
} from "@constants";
import { hitTestBox } from "@core/hitTest";
import { CanvasPointer } from "@core/pointer";
import { BoundingBox, Point, XYCoords } from "@core/types";
import { rotatePoint } from "@core/utils";

function isPathClosed(path: Point[]) {
  if (path.length < 3) return true;
  const [startX, startY] = path[0];
  const [endX, endY] = path[path.length - 1];

  return Math.hypot(endX - startX, endY - startY) <= PATH_JOIN_THRESHOLD;
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

const PATH_HIT_THRESHOLD = 10;

export class FreedrawHandler extends ElementHandler<FreedrawElement> {
  create(box: BoundingBox) {
    return {
      ...GENERIC_ELEMENT_PROPS,
      ...box,
      type: "freedraw",
      path: [[0, 0]],
    } as FreedrawElement;
  }

  hitTest(element: FreedrawElement, coords: XYCoords) {
    const { x, y, w, h, rotate, path } = element;
    const cx = x + w / 2;
    const cy = y + h / 2;

    const threshold = PATH_HIT_THRESHOLD;
    const rotatedCoords = rotatePoint(coords.x, coords.y, cx, cy, -rotate);
    // point in path is relative to the element so coords must also be relative
    const relativeCoords = { x: rotatedCoords.x - x, y: rotatedCoords.y - y };

    // hit testing path is expensive, so check the boundingbox first
    if (!hitTestBox(element, rotatedCoords, threshold)) return false;
    if (isPathClosed(path)) return hitTestClosedPath(relativeCoords, path);
    return hitTestOpenPath(relativeCoords, path, threshold);
  }

  render(element: FreedrawElement, ctx: CanvasRenderingContext2D) {
    if (element.path.length < 1) return;
    const rX = element.w / 2;
    const rY = element.h / 2;

    ctx.translate(element.x + rX, element.y + rY);
    ctx.rotate(element.rotate);
    ctx.beginPath();

    ctx.moveTo(element.path[0][0] - rX, element.path[0][1] - rY);
    for (let i = 1; i < element.path.length; i += 1) {
      const point = element.path[i];
      ctx.lineTo(point[0] - rX, point[1] - rY);
    }

    ctx.stroke();
  }

  onCreateDrag(element: FreedrawElement, pointer: CanvasPointer) {
    const { x, y, w, h, path } = element;
    const point = pointer.currentPosition;
    const mutations = { x, y, w, h, path };
    const shiftX = Math.max(x - point.x, 0);
    const shiftY = Math.max(y - point.y, 0);

    mutations.x -= shiftX;
    mutations.y -= shiftY;
    mutations.w = Math.max(mutations.w, point.x - mutations.x) + shiftX;
    mutations.h = Math.max(mutations.h, point.y - mutations.y) + shiftY;

    if (shiftX || shiftY) {
      mutations.path.forEach((_point) => {
        const pathPoint = _point;
        pathPoint[0] = +(pathPoint[0] + shiftX).toFixed(ELEMENT_PRECISION);
        pathPoint[1] = +(pathPoint[1] + shiftY).toFixed(ELEMENT_PRECISION);
      });
    }

    // The latest point doesn't need shift since it is the cause of the shift.
    mutations.path.push([
      // make point relative to element position
      +(point.x - mutations.x).toFixed(ELEMENT_PRECISION),
      +(point.y - mutations.y).toFixed(ELEMENT_PRECISION),
    ]);

    this.app.elementLayer().mutateElement(element, mutations);
  }
}
