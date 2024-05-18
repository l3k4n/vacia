import { USERMODE, ZOOM_STEP } from "@constants";
import { registerAction } from "@core/actionManager";
import { getNewZoomState, getScreenCenterCoords } from "@core/utils";

// ==================================== UI =====================================
export const ZoomInAction = registerAction({
  id: "core:ui.zoom.in",
  label: "zoom in",
  exec(app) {
    const state = app.state();
    const value = state.zoom + ZOOM_STEP;
    const centerCoords = getScreenCenterCoords(state);
    const zoomState = getNewZoomState(value, centerCoords, state);
    app.setState(zoomState);
  },
});

export const ZoomOutAction = registerAction({
  id: "core:ui.zoom.out",
  label: "zoom in",
  exec(app) {
    const state = app.state();
    const value = state.zoom - ZOOM_STEP;
    const centerCoords = getScreenCenterCoords(state);
    const zoomState = getNewZoomState(value, centerCoords, state);
    app.setState(zoomState);
  },
});

export const ZoomResetAction = registerAction({
  id: "core:ui.zoom.reset",
  label: "zoom out",
  exec: ({ state, setState }) => {
    const centerCoords = getScreenCenterCoords(state());
    const zoomState = getNewZoomState(1, centerCoords, state());
    setState(zoomState);
  },
});

// ================================ Selection ==================================

export const DeleteSelectionAction = registerAction({
  id: "core:selection.delete",
  label: "delete",
  exec({ state, elementLayer }) {
    if (state().usermode !== USERMODE.IDLE) return;
    const elements = elementLayer().getSelectedElements();
    elements.forEach((elem) => elementLayer().deleteElement(elem));
  },
});

export const SelectAllAction = registerAction({
  id: "core:selection.select.all",
  label: "select all",
  exec(app) {
    const elementLayer = app.elementLayer();
    elementLayer.unselectAllElements();
    const elements = elementLayer.getInteractiveElements();
    elementLayer.selectElements(elements);
  },
});

// ================================ History ==================================

export const HistoryUndoAction = registerAction({
  id: "core:history.undo",
  label: "undo",
  exec(app) {
    const elementLayer = app.elementLayer();
    elementLayer.undo();
    elementLayer.unselectAllElements();
  },
})

export const HistoryRedoAction = registerAction({
  id: "core:history.redo",
  label: "redo",
  exec(app) {
    app.elementLayer().redo();
  },
})
