import { ElementHandler } from "./handler";
import { WysiwygEditor } from "./text-wysiwyg";
import { TextElement } from "./types";
import { DEFAULT_ELEMENT_FONT_PROPS, GENERIC_ELEMENT_PROPS } from "@constants";
import { hitTestBox } from "@core/hitTest";
import { BoundingBox, XYCoords } from "@core/types";
import { getScrollOffsetContainingBox } from "@core/utils";

export class TextHandler extends ElementHandler<TextElement> {
  features_supportsEditing = true;
  features_startEditingOnCreateEnd = true;

  editor = new WysiwygEditor(document.querySelector("#root")!);
  editing_element: TextElement | null = null;

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
    if (element === this.editing_element) return;

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

  onEditStart(element: TextElement) {
    this.editing_element = element;
    this.editor.start(element, this.app.state());
    this.editor.focus();

    this.editor.onChange((text) => {
      const { w, h } = this.editor.measureText(element, text);
      const state = this.app.state();
      this.app.elementLayer().mutateElement(element, { w, h, text });
      this.editor.update(element, state);
      this.editor.focus();

      // auto-scroll as user types
      this.app.setState({
        scrollOffset: getScrollOffsetContainingBox(element, state),
      });
    });

    this.editor.onBlur(() => this.app.stopEditing(element));
  }

  onEditEnd(element: TextElement) {
    this.editor.stop();
    this.editing_element = null;

    // remove elements with just whitespace
    if (element.text.trim() === "") {
      this.app.elementLayer().deleteElement(element);
    }
  }

  onEditViewStateChange(element: TextElement) {
    this.editor.update(element, this.app.state());
    this.editor.focus();
  }
}
