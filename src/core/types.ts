import DrawingTools from "./drawingTools";

export type DrawingToolLabel = "Hand" | (typeof DrawingTools)[number]["label"];

export interface AppState {
  width: number;
  height: number;
  activeTool: DrawingToolLabel;
  grid: { type: "line" | "none"; size: number };
  // canvas offset from { x: 0, y: 0 }
  scrollOffset: { x: number; y: number };
}

/* pointer state since the last pointer down */
export type CanvasPointer = {
  origin: { x: number; y: number };
  // distance between pointer down origin and current pointer position
  dragOffset: { x: number; y: number };
  // value of state.scrollOffset when pointer down occured
  initialScrollOffset: { x: number; y: number };
} | null;
