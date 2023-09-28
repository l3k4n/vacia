import { DrawingTools, ControlTools } from "./tools";

export type XYCoords = { x: number; y: number };
export type Point = [number, number];
export type BoundingBox = XYCoords & { w: number; h: number };
export type Writeable<T> = { -readonly [K in keyof T]: T[K] };

interface ElementTransforms {
  // if element is flipped along an axis
  flippedX?: boolean;
  flippedY?: boolean;
}

interface AbstractElement extends BoundingBox {
  /** modifications to make when rendering element (e.g invert, crop) */
  readonly transforms: ElementTransforms;
}
export interface ShapeElement extends AbstractElement {
  type: "shape";
  shape: "rect" | "ellipse";
}
export interface FreedrawElement extends AbstractElement {
  type: "freedraw";
  path: Point[];
}
export type CanvasElement = Readonly<ShapeElement | FreedrawElement>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CanvasElementMutations = { [key: string]: any };

/** Toolbar tools that have render elements (e.g Ellipse tool) */
export type DrawingToolLabel = (typeof DrawingTools)[number]["label"];
/** Toolbar tools that don't map to real elements (e.g Select tool) */
export type ControlToolLabel =
  (typeof ControlTools)[keyof typeof ControlTools]["label"];
/** Toolbar tool names */
export type ToolLabel = DrawingToolLabel | ControlToolLabel;

export type ToolbarPosition = "top" | "left" | "right" | "bottom";

export interface AppState {
  width: number;
  height: number;
  activeTool: ToolLabel;
  grid: { type: "line" | "none"; size: number };
  /** canvas offset from { x: 0, y: 0 } */
  scrollOffset: XYCoords;
  zoom: number;
  toolbarPosition: ToolbarPosition;
  /** bounding box (in virtual coords) to highlight when drag selecting */
  selectionHighlight: BoundingBox | null;
}

/* pointer state since the last pointer down */
export type PointerState = {
  origin: XYCoords;
  // distance between pointer down origin and current pointer position
  dragOffset: XYCoords;
  // value of state.scrollOffset when pointer down occured
  initialScrollOffset: XYCoords;
} | null;
