import DrawingTools from "./drawingTools";

export type XYCoords = { x: number; y: number };

export type DrawingToolLabel = "Hand" | (typeof DrawingTools)[number]["label"];

export interface AppState {
  width: number;
  height: number;
  activeTool: DrawingToolLabel;
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
