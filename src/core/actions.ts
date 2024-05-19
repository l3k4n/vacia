import { USERMODE, ZOOM_STEP } from "@constants";
import { registerAction } from "@core/actionManager";
import {
  getNewZoomState,
  getScreenCenterCoords,
  isInteractive,
} from "@core/utils";

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

export const LockSelectionAction = registerAction({
  id: "core:selection.lock",
  label: "lock",
  exec(app) {
    const elementLayer = app.elementLayer();
    elementLayer.getSelectedElements().forEach((element) => {
      elementLayer.lockElement(element);
    });
  },
});

export const EditSelectionAction = registerAction({
  id: "core:selection.edit",
  label: "select all",
  exec(app) {
    const selected = app.elementLayer().getSelectedElements();
    if (selected.length !== 1) return;
    app.requestEditStart(selected[0]);
  },
});

export const DeleteSelectionAction = registerAction({
  id: "core:selection.delete",
  label: "delete",
  exec(app) {
    const elementLayer = app.elementLayer();
    if (app.state().usermode !== USERMODE.IDLE) return;
    elementLayer
      .getSelectedElements()
      .forEach((elem) => elementLayer.deleteElement(elem));
  },
});

// ================================ Elements ==================================

export const UnlockAllAction = registerAction({
  id: "core:elements.unlock.all",
  label: "unlock",
  exec(app) {
    const elementLayer = app.elementLayer();
    elementLayer.getAllElements().forEach((element) => {
      if (isInteractive(element)) return;
      elementLayer.unlockElement(element);
    });
  },
});

export const SelectAllAction = registerAction({
  id: "core:elements.interactive.select",
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
});

export const HistoryRedoAction = registerAction({
  id: "core:history.redo",
  label: "redo",
  exec(app) {
    app.elementLayer().redo();
  },
});

// ============================== Preferences ==================================

export const ToggleGridAction = registerAction({
  id: "core:preferences.grid.toggle",
  label: "toggle grid",
  exec(app) {
    const state = app.state();
    const { grid } = state.preferences;
    const preferences = { ...state.preferences };
    Object.assign(preferences.grid, { ...grid, disabled: !grid.disabled });
    app.setState({ preferences });
  },
});
