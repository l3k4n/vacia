import { SELECTION_HANDLE_SIZE } from "@constants";
import { TransformHandle } from "@core/elements/types";
import { BoundingBox, XYCoords, RotatedBoundingBox } from "@core/types";
import { getRotatedBoxVertices, rotatePoint } from "@core/utils";

/** returns true if the coords is inside the box */
export function hitTestBox(box: BoundingBox, coords: XYCoords, thershold = 0) {
  let { x, y, w, h } = box;
  if (thershold) {
    x -= thershold;
    y -= thershold;
    w += thershold * 2;
    h -= thershold * 2;
  }
  const isInHorizontalBounds = coords.x >= x && coords.x <= x + w;
  const isInVerticalBounds = coords.y >= y && coords.y <= y + h;
  return isInHorizontalBounds && isInVerticalBounds;
}

/** returns true if the coords is inside the rotated box */
export function hitTestRotatedBox(box: RotatedBoundingBox, coords: XYCoords) {
  const rotatedCoords = rotatePoint(
    coords.x,
    coords.y,
    box.x + box.w / 2,
    box.y + box.h / 2,
    -box.rotate,
  );
  return hitTestBox(box, rotatedCoords);
}

/** returns true if the rotated box is completely within the second box */
export function hitTestRotatedBoxInBox(
  rbox: RotatedBoundingBox,
  box: BoundingBox,
): boolean {
  const { ne, nw, se, sw } = getRotatedBoxVertices(rbox);
  return (
    hitTestBox(box, ne) ||
    hitTestBox(box, nw) ||
    hitTestBox(box, sw) ||
    hitTestBox(box, se)
  );
}

/** returns the transform handle at the coords */
export function hitTestTransformHandles(
  handles: TransformHandle[],
  coords: XYCoords,
  scale: number,
) {
  const threshold = SELECTION_HANDLE_SIZE / scale;
  let hitHandle: TransformHandle | null = null;

  for (let i = 0; i < handles.length; i += 1) {
    const handle = handles[i];
    // create a small box at each handle and check if coords is in that box
    const handleBox = {
      x: handle.x - threshold / 2,
      y: handle.y - threshold / 2,
      w: threshold,
      h: threshold,
    };
    if (hitTestBox(handleBox, coords)) {
      hitHandle = handle;
      break;
    }
  }

  return hitHandle;
}
