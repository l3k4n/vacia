import { USERMODE, ZOOM_STEP } from "@constants";
import { Action, AppData } from "@core/types";
import { getNewZoomState, getScreenCenterCoords } from "@core/viewport";

const incrementalZoom = ({ state, setState }: AppData, direction: 1 | -1) => {
  const value = state.zoom + ZOOM_STEP * direction;
  const centerCoords = getScreenCenterCoords(state);
  const zoomState = getNewZoomState(value, centerCoords, state);
  setState(zoomState);
};

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
      const centerCoords = getScreenCenterCoords(state);
      const zoomState = getNewZoomState(1, centerCoords, state);
      setState(zoomState);
    },
  },
  "core:elements.deleteSelected": {
    label: "delete",
    exec({ state, elementLayer }) {
      if (state.usermode !== USERMODE.IDLE) return;
      const elements = elementLayer.getSelectedElements();
      elements.forEach((elem) => elementLayer.deleteElement(elem));
    },
  },
  "core:elements.selectAll": {
    label: "select all",
    exec({ elementLayer }) {
      elementLayer.unselectAllElements();
      const elements = elementLayer.getAllElements();
      elementLayer.selectElements(elements);
    },
  },
};
