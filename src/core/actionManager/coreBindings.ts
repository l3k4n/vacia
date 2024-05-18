export const CoreBindings: Record<string, string> = {
  "ctrl+=": "core:ui.zoomIn",
  "ctrl+-": "core:ui.zoomOut",
  "ctrl+0": "core:ui.resetZoom",
  delete: "core:elements.deleteSelected",
  backspace: "core:elements.deleteSelected",
  "ctrl+a": "core:elements.selectAll",
  "ctrl+z": "core:history.undo",
  "ctrl+shift+z": "core:history.redo",
};
