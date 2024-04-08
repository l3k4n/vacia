import { AppState } from "./types";
import { ZoomInIcon, ZoomOutIcon } from "@assets/icons";
import { QuickActionType } from "@components/QuickActions";
import { USERMODE } from "@constants";

export function defaultAppState(): AppState {
  return {
    appBounds: { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight },
    activeTool: "Hand",
    grid: { type: "line", size: 20 },
    scrollOffset: { x: 0, y: 0 },
    zoom: 1,
    selectionHighlight: null,
    usermode: USERMODE.IDLE,
    contextMenuItems: [],
  };
}

export function defaultQuickActions(): QuickActionType[] {
  return [
    {
      icon: ZoomInIcon,
      id: "core:ui.zoomIn",
      label: "zoom in",
    },
    {
      icon: ZoomOutIcon,
      id: "core:ui.zoomOut",
      label: "zoom out",
    },
  ];
}
