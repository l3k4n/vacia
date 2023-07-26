import DrawingTools from "./drawingTools";

export type DrawingToolLabel = "Hand" | (typeof DrawingTools)[number]["label"];

export interface AppState {
  width: number;
  height: number;
  activeTool: DrawingToolLabel;
}
