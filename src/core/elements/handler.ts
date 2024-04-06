/* eslint-disable @typescript-eslint/no-empty-function */

import { CanvasElement } from "./types";
import ElementLayer from "@core/elementLayer";
import { CanvasPointer } from "@core/pointer";
import { AppState, BoundingBox, XYCoords } from "@core/types";

type HandlerAppData = {
  state: () => AppState;
  elementLayer: () => ElementLayer;
};

interface HandlerEventProps {
  clientX: number;
  clientY: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  isPrimary: boolean;
  pointerType: string;
}

export abstract class ElementHandler<T extends CanvasElement = CanvasElement> {
  protected app: HandlerAppData;
  features_supportsEditing = false;
  features_startEditingOnCreateEnd = false;

  constructor(appdata: HandlerAppData) {
    this.app = appdata;
  }

  // required methods
  abstract create(box: BoundingBox): T;
  abstract hitTest(element: T, coords: XYCoords): boolean;
  abstract render(element: T, ctx: CanvasRenderingContext2D): void;

  onCreateStart(element: T, pointer: CanvasPointer, e: HandlerEventProps) {}
  onCreateClick(element: T, pointer: CanvasPointer, e: HandlerEventProps) {}
  onCreateDrag(element: T, pointer: CanvasPointer, e: HandlerEventProps) {}
  onCreateEnd(element: T, e: HandlerEventProps) {}

  // edit events
  onEditStart(element: T) {}
  onEditEnd(element: T) {}

  static EventFromMouse(e: MouseEvent): HandlerEventProps {
    const { clientX, clientY, shiftKey, ctrlKey } = e;
    return {
      clientX,
      clientY,
      shiftKey,
      ctrlKey,
      isPrimary: e.buttons === 1,
      pointerType: "mouse",
    };
  }
}
