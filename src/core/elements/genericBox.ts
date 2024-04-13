import { CanvasElement } from "./types";
import { CanvasPointer } from "@core/pointer";
import { AppState } from "@core/types";
import { normalizeBox, resizeAspectRatio, snapToGrid } from "@core/utils";

/** helper methods for which treat the element like a normal rectangle */
export function handleCreateDrag(
  elem: CanvasElement,
  pointer: CanvasPointer,
  e: PointerEvent,
  state: AppState,
) {
  const { grid } = state;
  const box = pointer.dragBox;

  // snap dimension if ctrl is not held
  if (!e.ctrlKey) {
    const newSize = snapToGrid({ x: box.w, y: box.h }, grid);
    box.w = newSize.x;
    box.h = newSize.y;
  }

  // make aspect ratio equal if shift is held
  if (e.shiftKey) {
    const newSize = resizeAspectRatio(elem.w, elem.h, box.w, box.h, true);
    box.w = newSize.w;
    box.h = newSize.h;
  }

  return normalizeBox(box);
}
