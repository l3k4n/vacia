import { CanvasElement, Dimensions, XYCoords } from "@core/types";

function hitTestRect(dimensions: Dimensions, coords: XYCoords) {
  const { x, y, w, h } = dimensions;
  const isInHorizontalBounds = coords.x >= x && coords.x <= x + w;
  const isInVerticalBounds = coords.y >= y && coords.y <= y + h;
  return isInHorizontalBounds && isInVerticalBounds;
}

function hitTestEllipse(dimensions: Dimensions, coords: XYCoords) {
  const { x, y, w, h } = dimensions;

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
  dimensions: Dimensions,
): boolean {
  const horizontalBoundsFitsBox =
    element.x >= dimensions.x &&
    element.x + element.w <= dimensions.x + dimensions.w;
  const verticalBoundsFitsBox =
    element.y >= dimensions.y &&
    element.y + element.h <= dimensions.y + dimensions.h;

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
