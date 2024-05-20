import { BoundingBox, RotatedBoundingBox } from "@core/types";

export interface CanvasElement extends BoundingBox {
  type: string;
  fill: string;
  rotate: number;
  flippedX: boolean;
  flippedY: boolean;
  locked: boolean;
  deleted: boolean;
}

export interface TransformHandle {
  x: number;
  y: number;
  type: "ne" | "nw" | "se" | "sw" | "rotate";
  anchorX: number;
  anchorY: number;
}

export interface TransformingElement {
  element: CanvasElement;
  initialElement: CanvasElement;
}

export type NullObject = { type: null };
export type ElementObject = { type: "element"; element: CanvasElement };
export type NonInteractiveElementObject = {
  type: "nonInteractiveElement";
  element: CanvasElement;
};
export type SelectionObject = {
  type: "selectionBox";
  box: RotatedBoundingBox;
  elements: CanvasElement[];
  /** Keep a ref to element hit inside selectionBox because we can't tell
   * if user wants to click inner element or drag selectionBox */
  hitElement: CanvasElement | null;
};
export type TransformHandleObject = {
  type: "transformHandle";
  box: RotatedBoundingBox;
  elements: CanvasElement[];
  handle: TransformHandle;
};

export type CanvasObject =
  | ElementObject
  | NonInteractiveElementObject
  | SelectionObject
  | TransformHandleObject
  | NullObject;
