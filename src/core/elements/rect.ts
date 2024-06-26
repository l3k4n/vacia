import * as GenericBoxUtils from "./genericBox";
import { ElementHandler } from "./handler";
import { CanvasElement } from "./types";
import { hitTestBox } from "@core/hitTest";
import { CanvasPointer } from "@core/pointer";
import { XYCoords } from "@core/types";
import { rotatePoint } from "@core/utils";

interface RectElement extends CanvasElement {
  type: "rect";
}

export class RectHandler extends ElementHandler<RectElement> {
  create(partialElement: CanvasElement): RectElement {
    return {
      ...partialElement,
      type: "rect",
    };
  }

  hitTest(element: RectElement, coords: XYCoords) {
    const { x, y, w, h, rotate } = element;
    const cX = x + w / 2;
    const cY = y + h / 2;

    const rotatedCoords = rotatePoint(coords.x, coords.y, cX, cY, -rotate);
    return hitTestBox(element, rotatedCoords);
  }

  render(element: RectElement, ctx: CanvasRenderingContext2D) {
    const { x, y, w, h, rotate, fill } = element;
    const rX = w / 2;
    const rY = h / 2;
    ctx.translate(x + rX, y + rY);
    ctx.rotate(rotate);

    ctx.fillStyle = fill;
    ctx.fillRect(-rX, -rY, w, h);
  }

  onCreateDrag(elem: RectElement, pointer: CanvasPointer) {
    const state = this.app.state();
    const mutations = GenericBoxUtils.handleCreateDrag(elem, pointer, state);
    this.app.elementLayer().mutateElement(elem, mutations);
  }
}
