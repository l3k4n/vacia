import { BoundingBox, RotatedBoundingBox, Point } from "@core/types";

interface AbstractElement extends BoundingBox {
  fill: string;
  rotate: number;
  flippedX: boolean;
  flippedY: boolean;
}

export interface RectElement extends AbstractElement {
  type: "rect";
}
export interface EllipseElement extends AbstractElement {
  type: "ellipse";
}
export interface FreedrawElement extends AbstractElement {
  type: "freedraw";
  path: Point[];
}
export interface TextElement extends AbstractElement {
  type: "text";
  fontSize: number;
  fontFamily: string;
  text: string;
}

export type CanvasElement = Readonly<
  RectElement | EllipseElement | FreedrawElement | TextElement
>;

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
  | SelectionObject
  | TransformHandleObject
  | NullObject;
