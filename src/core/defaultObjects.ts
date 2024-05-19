import { ZoomInAction, ZoomOutAction } from "./actions";
import { AppState } from "./types";
import { ZoomInIcon, ZoomOutIcon } from "@assets/icons";
import { RenderableAction } from "@components/QuickActions/types";
import { DEFAULT_TOOL, USERMODE } from "@constants";

export function defaultAppState(): AppState {
  return {
    activeTool: DEFAULT_TOOL,
    scrollOffset: { x: 0, y: 0 },
    zoom: 1,
    selectionHighlight: null,
    usermode: USERMODE.IDLE,
    contextMenuItems: [],
    preferences: {
      grid: { type: "line", size: 20, disabled: false },
      lockCurrentTool: false,
    },
  };
}

export function defaultRenderableActions(): RenderableAction[] {
  return [
    { Icon: ZoomInIcon, action: ZoomInAction },
    { Icon: ZoomOutIcon, action: ZoomOutAction },
  ];
}

export function defaultBindings(): Record<string, string> {
  return {
    "ctrl+=": "core:ui.zoom.in",
    "ctrl+-": "core:ui.zoom.out",
    "ctrl+0": "core:ui.zoom.reset",

    delete: "core:selection.delete",
    backspace: "core:selection.delete",

    enter: "core:selection.edit",

    "ctrl+l": "core:selection.lock",
    "ctrl+shift+l": "core:elements.unlock.all",

    "ctrl+a": "core:elements.interactive.select",

    "ctrl+z": "core:history.undo",
    "ctrl+shift+z": "core:history.redo",
  };
}
