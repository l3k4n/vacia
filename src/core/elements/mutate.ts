/* eslint-disable no-param-reassign */
import { CanvasElement, CanvasElementMutations, Writeable } from "@core/types";

/** This function only mutates elements and does not trigger re-render
 * or fire any event listeners associated with mutations.
 * `elementLayer.mutateElement` method for proper functionality. */
function ApplyElementSpecificMutation<T extends Writeable<CanvasElement>>(
  elem: T,
  mutations: CanvasElementMutations,
): T {
  if (mutations.x) elem.x = mutations.x;
  if (mutations.y) elem.y = mutations.y;
  if (mutations.w) elem.w = mutations.w;
  if (mutations.h) elem.h = mutations.h;

  switch (elem.type) {
    case "freedraw":
      if (mutations.path) elem.path = mutations.path;
      break;

    default:
      break;
  }

  return elem;
}

export default ApplyElementSpecificMutation;
