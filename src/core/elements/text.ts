/* eslint-disable max-classes-per-file */

import * as GenericBoxUtils from "./genericBox";
import { ElementHandler } from "./handler";
import { CanvasElement } from "./types";
import { hitTestBox } from "@core/hitTest";
import { CanvasPointer } from "@core/pointer";
import { AppState, XYCoords } from "@core/types";
import {
  getScrollOffsetContainingBox,
  toScreenCoords,
  toScreenOffset,
} from "@core/utils";

interface TextElement extends CanvasElement {
  type: "text";
  text_id: number;
  fontSize: number;
  fontFamily: string;
  text: string;
  fixedWidth: boolean;
}

interface TextLayout {
  w: number;
  h: number;
  lines: string[];
}

const MIN_EDITOR_WIDTH = 2;

const measuringCtx = document.createElement("canvas").getContext("2d")!;

export class TextHandler extends ElementHandler<TextElement> {
  features_supportsEditing = true;
  features_startEditingOnCreateEnd = true;

  previous_element_id = 0;
  editor = TextHandler.createEditor();
  editing_element: TextElement | null = null;
  layout_cache = new Map<number, TextLayout>();

  create(partialElement: CanvasElement): TextElement {
    this.previous_element_id += 1;
    return {
      ...partialElement,
      // @ts-ignore
      text_id: this.previous_element_id,
      type: "text",
      fontSize: 14, // px
      fontFamily: "Arial",
      fixedWidth: false,
      text: "",
    };
  }

  hitTest(element: TextElement, coords: XYCoords) {
    return hitTestBox(element, coords);
  }

  render(element: TextElement, ctx: CanvasRenderingContext2D) {
    if (element === this.editing_element) return;


    const { x, y, w, h, rotate, fill, fontFamily, fontSize } = element;
    const rX = w / 2;
    const rY = h / 2;

    ctx.translate(x + rX, y + rY);
    ctx.rotate(rotate);
    ctx.beginPath();

    ctx.fillStyle = fill;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";

    const textLayout = this.getCachedTextLayout(element);
    for (let i = 0; i < textLayout.lines.length; i += 1) {
      ctx.fillText(textLayout.lines[i], -rX, -rY + i * fontSize);
    }
  }

  onCreateDrag(elem: TextElement, pointer: CanvasPointer) {
    const state = this.app.state();
    this.app.elementLayer().mutateElement(
      elem,
      GenericBoxUtils.handleCreateDrag(elem, pointer, state),
    );
  }

  onCreateEnd(element: TextElement) {
    if (element.h < element.fontSize || element.w < MIN_EDITOR_WIDTH) {
      // set min size, if element is too small
      this.app.elementLayer().mutateElement(element, {
        w: Math.max(element.w, MIN_EDITOR_WIDTH),
        h: Math.max(element.h, element.fontSize),
      });
    } else {
      // since user dragged to a size larger than min, set fixedWidth
      this.app.elementLayer().mutateElement(element, { fixedWidth: true });
    }
  }

  onEditStart(element: TextElement) {
    // start editor
    document.getElementById("root")!.appendChild(this.editor);
    this.editor.focus();
    this.editing_element = element;
    this.updateEditor(
      TextHandler.getTextLayout(element, element.text),
      this.app.state(),
    );

    // set event handlers 
    this.editor.onblur = () => this.app.makeUserIdle();
    this.editor.oninput = () => {
      const state = this.app.state();
      const newText = this.editor.value;
      const textLayout = TextHandler.getTextLayout(element, newText);
      this.layout_cache.set(element.text_id, textLayout);

      this.app.elementLayer().mutateElement(element, {
        w: Math.max(textLayout.w, MIN_EDITOR_WIDTH),
        h: Math.max(textLayout.h, element.fontSize),
        text: newText,
      });

      this.updateEditor(textLayout, state);

      // auto-scroll as user types
      this.app.setState({
        scrollOffset: getScrollOffsetContainingBox(element, state),
      });
    }

  }

  onEditEnd(element: TextElement) {
    this.editor.onblur = null;
    this.editor.oninput = null;
    this.editor.value = "";
    this.editor.remove();
    this.editing_element = null;

    // remove elements with just whitespace
    if (!element.text.trim()) {
      this.app.elementLayer().dangerous_discardElement(element);
    }
  }

  onEditViewStateChange(element: TextElement) {
    this.updateEditor(this.getCachedTextLayout(element), this.app.state());
    this.editor.focus();
  }

  onResize(element: TextElement) {
    const layout = TextHandler.getTextLayout(element, element.text);
    this.layout_cache.set(element.text_id, layout);
  }

  updateEditor(textLayout: TextLayout, state: AppState) {
    const element = this.editing_element!;

    const { style } = this.editor;
    const coords = toScreenCoords(element, state);

    style.width = `${toScreenOffset(textLayout.w, state)}px`;
    style.height = `${toScreenOffset(textLayout.h, state)}px`;
    style.top = `${coords.y}px`;
    style.left = `${coords.x}px`;
    style.color = element.fill;
    style.fontSize = `${element.fontSize * state.zoom}px`;
    style.fontFamily = element.fontFamily;
    style.transform = `rotate(${element.rotate * (180 / Math.PI)}deg)`;
  }

  static createEditor(): HTMLTextAreaElement {
    const editor = document.createElement("textarea");
    Object.assign(editor.style, {
      position: "absolute",
      overflow: "hidden",
      lineHeight: "1",
      display: "inline-block",
      resize: "none",
      wordWrap: "break-word",
      whiteSpace: "pre-wrap",
      boxSizing: "content-box",
      background: "transparent",
    });

    return editor;
  }


  getCachedTextLayout(element: TextElement): TextLayout {
    if (!this.layout_cache.has(element.text_id)) {
      const layout = TextHandler.getTextLayout(element, element.text);
      this.layout_cache.set(element.text_id, layout);
      return layout
    }

    return this.layout_cache.get(element.text_id)!;
  }

  static getTextLayout(element: TextElement, newText: string): TextLayout {
    const lines = newText.split("\n");
    measuringCtx.font = `${element.fontSize}px ${element.fontFamily}`;

    if (!element.fixedWidth) {
      let w = 0;
      for (let i = 0; i < lines.length; i += 1) {
        // line break has non-zero width, so add it to each line
        w = Math.max(w, measuringCtx.measureText(`${lines[i]}\n`).width);
      }

      return { w, h: lines.length * element.fontSize, lines };
    }
    const formattedLines: string[] = [];


    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      if (measuringCtx.measureText(line).width <= element.w) {
        formattedLines.push(line);
      } else {
        formattedLines.push(...TextHandler.wrapLine(line, element.w));
      }
    }

    return {
      w: element.w,
      h: formattedLines.length * element.fontSize,
      lines: formattedLines,
    }
  }

  static wrapWord(word: string, max: number): string[] {
    const lines: string[] = [];

    let currentLine = "";
    let currentLineWidth = 0;

    word.split("").forEach((ch) => {
      const chWidth = measuringCtx.measureText(ch).width;
      if (chWidth + currentLineWidth <= max) {
        currentLine += ch;
        currentLineWidth += chWidth;
      } else {
        lines.push(currentLine);
        currentLine = ch;
        currentLineWidth = chWidth;
      }
    });

    if (currentLine) lines.push(currentLine);

    return lines;
  }

  static wrapLine(line: string, max: number): string[] {
    const lines: string[] = [];

    const currentLine: string[] = [];
    let currentLineWidth = 0;

    line.split(" ").forEach((word) => {
      const wordWidth = measuringCtx.measureText(`${word} `).width;
      if (wordWidth + currentLineWidth <= max) {
        currentLine.push(word);
        currentLineWidth += wordWidth;
      } else if (wordWidth <= max) {
        if (currentLine.length) lines.push(currentLine.join(" "));
        currentLine.length = 0;
        currentLine.push(word);
        currentLineWidth = wordWidth;
      } else {
        if (currentLine.length) lines.push(currentLine.join(" "));
        const wordSections = TextHandler.wrapWord(word, max);
        const currentWord = wordSections.pop()!;
        lines.push(...wordSections);
        currentLine.length = 0;
        currentLine.push(currentWord);
        currentLineWidth = measuringCtx.measureText(currentWord).width;
      }
    })

    if (currentLine.length) lines.push(currentLine.join(" "));

    return lines;
  }
}
