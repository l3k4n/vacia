import { CanvasElement, BoundingBox, XYCoords } from "@core/types";

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

  // If value <= 1, point is in the ellipse.
  return value <= 1;
}

/** Returns true if element is completely contained within the bounding box */
export function hitTestElementAgainstBox(
  element: CanvasElement,
  box: BoundingBox,
): boolean {
  const horizontalBoundsFitsBox =
    element.x >= box.x && element.x + element.w <= box.x + box.w;
  const verticalBoundsFitsBox =
    element.y >= box.y && element.y + element.h <= box.y + box.h;

  return horizontalBoundsFitsBox && verticalBoundsFitsBox;
}

/** Returns true if a point is inside the specified bounding box */
export function hitTestPointAgainstBox(
  element: CanvasElement,
  coords: XYCoords,
): boolean {
  switch (element.type) {
    case "shape":
      if (element.shape === "rect") return hitTestRect(element, coords);
      return hitTestEllipse(element, coords);

    case "freedraw":
      return hitTestRect(element, coords);

    default:
      return false;
  }
}
