import { AppState } from "./types";

export default function getDefaultAppState(window: Window): AppState {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    activeTool: "Hand",
    grid: { type: "line", size: 20 },
    scrollOffset: { x: 0, y: 0 },
    zoom: 1,
    toolbarPosition: "left",
    selectionHighlight: null,
  };
}
