/* eslint-disable no-param-reassign */
import { ELEMENT_PRECISION } from "@constants";
import { CanvasElement, CanvasElementMutations, Writeable } from "@core/types";

/** This function only mutates elements and does not trigger re-render
 * or fire any event listeners associated with mutations.
 * `elementLayer.mutateElement` method for proper functionality. */
function ApplyElementSpecificMutation<T extends Writeable<CanvasElement>>(
  elem: T,
  mutations: CanvasElementMutations,
): T {
  if (typeof mutations.x === "number") {
    elem.x = +mutations.x.toFixed(ELEMENT_PRECISION);
  }
  if (typeof mutations.y === "number") {
    elem.y = +mutations.y.toFixed(ELEMENT_PRECISION);
  }
  if (typeof mutations.w === "number") {
    elem.w = +mutations.w.toFixed(ELEMENT_PRECISION);
  }
  if (typeof mutations.h === "number") {
    elem.h = +mutations.h.toFixed(ELEMENT_PRECISION);
  }

  if (mutations.styles) elem.styles = mutations.styles;

  if (mutations.transforms) elem.transforms = mutations.transforms;

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
