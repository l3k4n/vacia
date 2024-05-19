/* eslint-disable @typescript-eslint/no-empty-function */

import { CanvasElement } from "./types";
import ElementLayer from "@core/elementLayer";
import { CanvasPointer } from "@core/pointer";
import { AppState, BoundingBox, XYCoords } from "@core/types";

type HandlerAppData = {
  state: () => AppState;
  elementLayer: () => ElementLayer;
  makeUserIdle: () => void;
  setState<K extends keyof AppState>(state: Pick<AppState, K>): void;
};

export abstract class ElementHandler<T extends CanvasElement = CanvasElement> {
  protected app: HandlerAppData;
  features_supportsEditing = false;
  features_startEditingOnCreateEnd = false;

  constructor(appdata: HandlerAppData) {
    this.app = appdata;
  }

  /** Initializes new element object. NOTE: not the same as onCreateStart,
   * it may be called even when user is not creating */
  abstract create(box: BoundingBox): T;
  /** returns a boolean indicating whether `coords` is inside the element */
  abstract hitTest(element: T, coords: XYCoords): boolean;
  abstract render(element: T, ctx: CanvasRenderingContext2D): void;

  /** called immediately after user starts creating */
  onCreateStart(element: T, pointer: CanvasPointer) {}
  /** called when user moves pointer while creating */
  onCreateDrag(element: T, pointer: CanvasPointer) {}
  /** called once user is done creating */
  onCreateEnd(element: T) {}

  /** called immediately after user starts editing */
  onEditStart(element: T) {}
  /** called once user is done editing */
  onEditEnd(element: T) {}
  /** called when view state (e.g scrollOffset, zoom) changes while editing */
  onEditViewStateChange(element: T) {}

  /** called when elements angle changes */
  onRotate(element: T, initialElement: T, angle: number) {}

  /** called when elements dimensions changes */
  onResize(element: T, initialElement: T, scaleX: number, scaleY: number) {}
}
