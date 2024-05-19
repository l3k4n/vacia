import { CanvasElement } from "./types";
import { CanvasPointer } from "@core/pointer";
import { AppState } from "@core/types";
import { normalizeBox, resizeAspectRatio, snapToGrid } from "@core/utils";

/** helper methods for which treat the element like a normal rectangle */
export function handleCreateDrag(
  elem: CanvasElement,
  pointer: CanvasPointer,
  state: AppState,
) {
  const { grid } = state.preferences;
  const box = pointer.dragBox;

  // snap dimension if ctrl is not held
  if (!pointer.current_ctrlKey) {
    const newSize = snapToGrid({ x: box.w, y: box.h }, grid);
    box.w = newSize.x;
    box.h = newSize.y;
  }

  // make aspect ratio equal if shift is held
  if (pointer.current_shiftKey) {
    const newSize = resizeAspectRatio(elem.w, elem.h, box.w, box.h, true);
    box.w = newSize.w;
    box.h = newSize.h;
  }

  return { ...normalizeBox(box), flippedX: box.w < 0, flippedY: box.h < 0 };
}
