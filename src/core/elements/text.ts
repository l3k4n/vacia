/* eslint-disable max-classes-per-file */

import { ElementHandler } from "./handler";
import { CanvasElement } from "./types";
import { hitTestBox } from "@core/hitTest";
import { AppState, XYCoords } from "@core/types";
import {
  getScrollOffsetContainingBox,
  toScreenCoords,
  toScreenOffset,
} from "@core/utils";

interface TextElement extends CanvasElement {
  type: "text";
  fontSize: number;
  fontFamily: string;
  text: string;
}

class WysiwygEditor {
  container: HTMLElement;
  editor: HTMLTextAreaElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  start(elem: TextElement, state: AppState) {
    this.editor = document.createElement("textarea");
    this.editor.id = "wysiwyg-editor";
    this.editor.value = elem.text;

    Object.assign(this.editor.style, {
      position: "absolute",
      overflow: "hidden",
      lineHeight: "1",
      display: "inline-block",
      resize: "none",
      wordBreak: "normal",
      whiteSpace: "pre",
      overflowWrap: "break-word",
      boxSizing: "content-box",
      background: "transparent",
    });

    this.update(elem, state);
    this.container.appendChild(this.editor);
  }

  onChange(cb: (text: string) => void) {
    if (!this.editor) return;
    this.editor.oninput = () => cb(this.editor!.value);
  }

  onBlur(cb: () => void) {
    if (!this.editor) return;
    this.editor.onblur = () => cb();
  }

  focus() {
    this.editor?.focus();
  }

  update(elem: TextElement, state: AppState) {
    if (!this.editor) return;

    const { style } = this.editor;
    const coords = toScreenCoords(elem, state);
    const size = {
      w: toScreenOffset(elem.w, state),
      h: toScreenOffset(elem.h, state),
    };

    style.width = `${size.w}px`;
    style.height = `${size.h}px`;
    style.top = `${coords.y}px`;
    style.left = `${coords.x}px`;
    style.color = elem.fill;
    style.fontSize = `${elem.fontSize * state.zoom}px`;
    style.fontFamily = elem.fontFamily;
    style.transform = `rotate(${elem.rotate * (180 / Math.PI)}deg)`;
  }

  stop() {
    this.editor?.remove();
  }
}

const measuringCtx = document.createElement("canvas").getContext("2d")!;

function measureText(element: TextElement, text: string) {
  if (text === "") return { w: 0, h: 0 };

  const { fontSize, fontFamily } = element;
  const lines = text.split("\n");
  let w = 0;
  const h = lines.length * fontSize;

  measuringCtx.font = `${fontSize}px ${fontFamily}`;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const size = measuringCtx.measureText(line);
    w = Math.max(w, size.width);
  }

  return { w, h };
}

export class TextHandler extends ElementHandler<TextElement> {
  features_supportsEditing = true;
  features_startEditingOnCreateEnd = true;

  editor = new WysiwygEditor(document.querySelector("#root")!);
  editing_element: TextElement | null = null;

  create(partialElement: CanvasElement): TextElement {
    return {
      ...partialElement,
      type: "text",
      fontSize: 14, // px
      fontFamily: "Arial",
      text: "",
    };
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

    if (element.h < element.fontSize || element.w < 1) {
      this.app.elementLayer().mutateElement(element, {
        w: Math.max(element.w, 1),
        h: Math.max(element.h, element.fontSize),
      });

      this.editor.update(element, this.app.state());
    }

    this.editor.onChange((text) => {
      const state = this.app.state();

      const { w, h } = measureText(element, text);
      this.app.elementLayer().mutateElement(element, {
        w: Math.max(w, 1),
        h: Math.max(h, element.fontSize),
        text,
      });

      this.editor.update(element, state);
      this.editor.focus();

      // auto-scroll as user types
      this.app.setState({
        scrollOffset: getScrollOffsetContainingBox(element, state),
      });
    });

    this.editor.onBlur(() => this.app.makeUserIdle());
  }

  onEditEnd(element: TextElement) {
    this.editor.stop();
    this.editing_element = null;

    // remove elements with just whitespace
    if (element.text.trim() === "") {
      this.app.elementLayer().dangerous_discardElement(element);
    }
  }

  onEditViewStateChange(element: TextElement) {
    this.editor.update(element, this.app.state());
    this.editor.focus();
  }
}
