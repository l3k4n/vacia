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
  label: "Zoom in",
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
  label: "Zoom out",
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
  label: "Reset zoom",
  exec: ({ state, setState }) => {
    const centerCoords = getScreenCenterCoords(state());
    const zoomState = getNewZoomState(1, centerCoords, state());
    setState(zoomState);
  },
});

// ================================ Selection ==================================

export const LockSelectionAction = registerAction({
  id: "core:selection.lock",
  label: "Lock",
  exec(app) {
    const elementLayer = app.elementLayer();
    elementLayer.getSelectedElements().forEach((element) => {
      elementLayer.lockElement(element);
    });
  },
});

export const EditSelectionAction = registerAction({
  id: "core:selection.edit",
  label: "Edit",
  exec(app) {
    const selected = app.elementLayer().getSelectedElements();
    if (selected.length !== 1) return;
    app.requestEditStart(selected[0]);
  },
});

export const DeleteSelectionAction = registerAction({
  id: "core:selection.delete",
  label: "Delete",
  exec(app) {
    const elementLayer = app.elementLayer();
    if (app.state().usermode !== USERMODE.IDLE) return;
    elementLayer
      .getSelectedElements()
      .forEach((elem) => elementLayer.deleteElement(elem));
  },
});

export const SendBackwardsAction = registerAction({
  id: "core:selection.move.back.one",
  label: "Send backwards",
  exec(app) {
    app.elementLayer().moveBackWard(app.elementLayer().getSelectedElements());
  },
});

export const SendToBackAction = registerAction({
  id: "core:selection.move.back.all",
  label: "Send to back",
  exec(app) {
    app.elementLayer().sendToBack(app.elementLayer().getSelectedElements());
  },
});

export const BringForwardAction = registerAction({
  id: "core:selection.move.front.one",
  label: "Bring forward",
  exec(app) {
    app.elementLayer().moveForward(app.elementLayer().getSelectedElements());
  },
});

export const BringToFrontAction = registerAction({
  id: "core:selection.move.front.all",
  label: "Bring to front",
  exec(app) {
    app.elementLayer().sendToFront(app.elementLayer().getSelectedElements());
  },
});

// ================================ Elements ==================================

export const UnlockAllAction = registerAction({
  id: "core:elements.unlock.all",
  label: "Unlock all",
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
  label: "Select all",
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
  label: "Undo",
  exec(app) {
    const elementLayer = app.elementLayer();
    elementLayer.undo();
    elementLayer.unselectAllElements();
  },
});

export const HistoryRedoAction = registerAction({
  id: "core:history.redo",
  label: "Redo",
  exec(app) {
    app.elementLayer().redo();
  },
});

// ============================== Preferences ==================================

export const ToggleGridAction = registerAction({
  id: "core:preferences.grid.toggle",
  label: "Show / Hide grid",
  exec(app) {
    const state = app.state();
    const { grid } = state.preferences;
    const preferences = { ...state.preferences };
    Object.assign(preferences.grid, { ...grid, disabled: !grid.disabled });
    app.setState({ preferences });
  },
});
