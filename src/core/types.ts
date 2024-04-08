import { ToolLabel } from "./tools";
import { ContextMenuItem } from "@components/ContextMenu";
import { USERMODE } from "@constants";

export type XYCoords = { x: number; y: number };
export type Point = [number, number];

export type BoundingBox = XYCoords & { w: number; h: number };
export type RotatedBoundingBox = BoundingBox & { rotate: number };

export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export interface AppState {
  appBounds: BoundingBox;
  activeTool: ToolLabel;
  grid: { type: "line" | "none"; size: number };
  /** canvas offset from { x: 0, y: 0 } */
  scrollOffset: XYCoords;
  zoom: number;
  /** bounding box (in virtual coords) to highlight when drag selecting */
  selectionHighlight: BoundingBox | null;
  usermode: USERMODE;
  contextMenuItems: ContextMenuItem[];
}
