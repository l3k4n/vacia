import { ElementHandler } from "./handler";
import { TextElement } from "./types";
import { DEFAULT_ELEMENT_FONT_PROPS, GENERIC_ELEMENT_PROPS } from "@constants";
import { hitTestBox } from "@core/hitTest";
import { BoundingBox, XYCoords } from "@core/types";

export class TextHandler extends ElementHandler<TextElement> {
  create(box: BoundingBox) {
    return {
      ...GENERIC_ELEMENT_PROPS,
      ...DEFAULT_ELEMENT_FONT_PROPS,
      ...box,
      type: "text",
      text: "",
    } as TextElement;
  }

  hitTest(element: TextElement, coords: XYCoords) {
    return hitTestBox(element, coords);
  }

  render(element: TextElement, ctx: CanvasRenderingContext2D) {
    const { x, y, w, h, rotate, text, fill, fontFamily, fontSize } = element;
    const rX = w / 2;
    const rY = h / 2;

    ctx.translate(x + rX, y + rY);
    ctx.rotate(rotate);
    ctx.beginPath();

    ctx.fillStyle = fill;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";

    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i], -rX, -rY + i * fontSize);
    }
  }
}
