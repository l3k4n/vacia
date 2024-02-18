// bindings are part of the user UX.
export const CoreBindings: Record<string, string> = {
  "ctrl+=": "core:ui.zoomIn",
  "ctrl+-": "core:ui.zoomOut",
  "ctrl+0": "core:ui.resetZoom",
  delete: "core:elements.deleteSelected",
  backspace: "core:elements.deleteSelected",
  "ctrl+a": "core:elements.selectAll",
};
