import { Action, ActionManagerAppData } from ".";
import { USERMODE, ZOOM_STEP } from "@constants";
import { getNewZoomState, getScreenCenterCoords } from "@core/utils";

function incrementalZoom(app: ActionManagerAppData, direction: 1 | -1) {
  const state = app.state();
  const value = state.zoom + ZOOM_STEP * direction;
  const centerCoords = getScreenCenterCoords(state);
  const zoomState = getNewZoomState(value, centerCoords, state);
  app.setState(zoomState);
}

export const CoreActions: Record<string, Action> = {
  "core:ui.zoomIn": {
    label: "zoom in",
    exec: (appData) => incrementalZoom(appData, 1),
  },
  "core:ui.zoomOut": {
    label: "zoom out",
    exec: (appData) => incrementalZoom(appData, -1),
  },
  "core:ui.resetZoom": {
    label: "zoom out",
    exec: ({ state, setState }) => {
      const centerCoords = getScreenCenterCoords(state());
      const zoomState = getNewZoomState(1, centerCoords, state());
      setState(zoomState);
    },
  },
  "core:elements.deleteSelected": {
    label: "delete",
    exec({ state, elementLayer }) {
      if (state().usermode !== USERMODE.IDLE) return;
      const elements = elementLayer().getSelectedElements();
      elements.forEach((elem) => elementLayer().deleteElement(elem));
    },
  },
  "core:elements.selectAll": {
    label: "select all",
    exec(app) {
      const elementLayer = app.elementLayer();
      elementLayer.unselectAllElements();
      const elements = elementLayer.getInteractiveElements();
      elementLayer.selectElements(elements);
    },
  },
};
