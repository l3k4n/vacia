import { AppState, PointerState } from "./types";
import { USERMODE } from "@constants";

export function createAppState(): AppState {
  return {
    appBounds: { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight },
    activeTool: "Hand",
    grid: { type: "line", size: 20 },
    scrollOffset: { x: 0, y: 0 },
    zoom: 1,
    toolbarPosition: "left",
    selectionHighlight: null,
    usermode: USERMODE.IDLE,
    contextMenu: null,
  };
}

export function createPointerState(e: PointerEvent): PointerState {
  return {
    origin: { x: e.clientX, y: e.clientY },
    drag: {
      offset: { x: 0, y: 0 },
      previousOffset: { x: 0, y: 0 },
      occurred: false,
    },
    hit: { element: null, transformHandle: null },
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey || e.metaKey,
  };
}
