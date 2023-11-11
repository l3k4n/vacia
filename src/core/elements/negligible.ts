import { AppState, CanvasElement } from "@core/types";

/** checks if element should be discarded (i.e too small, etc)  */
export function isElementNegligible(
  element: CanvasElement,
  { grid }: AppState,
) {
  switch (element.type) {
    case "freedraw":
      return element.path.length < 2;

    case "shape":
      // shape is smaller than one grid pixel
      return element.w < grid.size && element.h < grid.size;

    default:
      return false;
  }
}
