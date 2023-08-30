import { DrawingTools, ControlTools } from "./tools";

export type XYCoords = { x: number; y: number };

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
