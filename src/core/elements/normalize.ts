/* eslint-disable no-param-reassign */
import { ELEMENT_PRECISION } from "@constants";
import { CanvasElement, Mutable } from "@core/types";

function normalizeElement<T extends Mutable<CanvasElement>>(elem: T): T {
  elem.x = +elem.x.toFixed(ELEMENT_PRECISION);
  elem.y = +elem.y.toFixed(ELEMENT_PRECISION);
  elem.w = +elem.w.toFixed(ELEMENT_PRECISION);
  elem.h = +elem.h.toFixed(ELEMENT_PRECISION);
  return elem;
}

export default normalizeElement;
