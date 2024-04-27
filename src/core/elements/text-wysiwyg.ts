import { TextElement } from "./types";
import { AppState } from "@core/types";
import { toScreenCoords, toScreenOffset } from "@core/utils";

export class WysiwygEditor {
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
