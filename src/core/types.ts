import { DrawingTools, ControlTools } from "./tools";

export type XYCoords = { x: number; y: number };
export type Point = [number, number];

interface AbstractElement {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface ShapeElement extends AbstractElement {
  type: "shape";
  shape: "rect" | "ellipse";
}
export interface FreedrawElement extends AbstractElement {
  type: "freedraw";
  path: Point[];
}
export type CanvasElement = ShapeElement | FreedrawElement;

/** Toolbar tools that have render elements (e.g Ellipse tool) */
export type DrawingToolLabel = (typeof DrawingTools)[number]["label"];
/** Toolbar tools that don't map to real elements (e.g Select tool) */
export type ControlToolLabel =
  (typeof ControlTools)[keyof typeof ControlTools]["label"];
/** Toolbar tool names */
export type ToolLabel = DrawingToolLabel | ControlToolLabel;

export interface AppState {
  width: number;
  height: number;
  activeTool: ToolLabel;
  grid: { type: "line" | "none"; size: number };
  // canvas offset from { x: 0, y: 0 }
  scrollOffset: XYCoords;
  zoom: number;
}

/* pointer state since the last pointer down */
export type CanvasPointer = {
  origin: XYCoords;
  // distance between pointer down origin and current pointer position
  dragOffset: XYCoords;
  // value of state.scrollOffset when pointer down occured
  initialScrollOffset: XYCoords;
} | null;
